using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentController : ControllerBase
    {
        private const string SepayProvider = "sepay";

        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(AppDbContext context, IConfiguration config, ILogger<PaymentController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        [HttpPost("sepay/webhook")]
        public async Task<IActionResult> SepayWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync();

            if (!VerifySepaySignature(body))
            {
                return Unauthorized(new { success = false });
            }

            SepayWebhookRequest? payload;
            try
            {
                payload = JsonSerializer.Deserialize<SepayWebhookRequest>(
                    body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
            }
            catch (JsonException)
            {
                return BadRequest(new { success = false });
            }

            if (payload is null)
            {
                return BadRequest(new { success = false });
            }

            if (!string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { success = true });
            }

            if (string.IsNullOrWhiteSpace(payload.Code))
            {
                return Ok(new { success = true });
            }

            var providerTransactionId = payload.Id.ToString(CultureInfo.InvariantCulture);
            var alreadyProcessed = await _context.Payments.AnyAsync(p =>
                p.Provider == SepayProvider && p.ProviderTransactionId == providerTransactionId);

            if (alreadyProcessed)
            {
                return Ok(new { success = true });
            }

            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.PaymentCode == payload.Code);
            if (invoice is null)
            {
                _logger.LogWarning("Sepay webhook ignored because payment code {PaymentCode} was not found.", payload.Code);
                return Ok(new { success = true });
            }

            var accountMatches = MatchesConfiguredAccount(payload.AccountNumber, payload.SubAccount);
            var amountMatches = payload.TransferAmount == invoice.Amount;
            var confirmed = accountMatches && amountMatches;
            var now = DateTime.UtcNow;

            var payment = new Payment
            {
                InvoiceId = invoice.Id,
                StudentId = invoice.StudentId,
                Amount = payload.TransferAmount,
                PaymentMethod = "online",
                Status = confirmed ? "confirmed" : "pending_confirmation",
                PaidAt = ParsePaidAt(payload.TransactionDate),
                ConfirmedAt = confirmed ? now : null,
                Provider = SepayProvider,
                ProviderTransactionId = providerTransactionId,
                ProviderReferenceCode = payload.ReferenceCode,
                ProviderPayload = body,
                AdminNote = confirmed ? null : BuildPendingNote(accountMatches, amountMatches, invoice.Amount, payload.TransferAmount),
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Payments.Add(payment);

            if (confirmed)
            {
                invoice.Status = "paid";
                invoice.UpdatedAt = now;
            }
            else if (invoice.Status == "unpaid")
            {
                invoice.Status = "pending_confirmation";
                invoice.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        private bool VerifySepaySignature(string body)
        {
            var secret = _config["Sepay:WebhookSecret"];
            if (string.IsNullOrWhiteSpace(secret)) return false;

            var signature = Request.Headers["X-SePay-Signature"].ToString();
            var timestampText = Request.Headers["X-SePay-Timestamp"].ToString();

            if (string.IsNullOrWhiteSpace(signature)) return false;
            if (!long.TryParse(timestampText, out var timestamp)) return false;

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (Math.Abs(now - timestamp) > 300) return false;

            var signed = $"{timestamp}.{body}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(signed))).ToLowerInvariant();
            var expected = $"sha256={hash}";

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(signature)
            );
        }

        private bool MatchesConfiguredAccount(string accountNumber, string? subAccount)
        {
            var configured = NormalizeAccountNumber(_config["Sepay:AccountNumber"]);
            if (string.IsNullOrWhiteSpace(configured)) return false;

            return NormalizeAccountNumber(accountNumber) == configured
                || NormalizeAccountNumber(subAccount) == configured;
        }

        private static string NormalizeAccountNumber(string? accountNumber)
        {
            return string.IsNullOrWhiteSpace(accountNumber)
                ? string.Empty
                : accountNumber.Replace(" ", string.Empty).Trim();
        }

        private static DateTime ParsePaidAt(string transactionDate)
        {
            return DateTimeOffset.TryParse(
                transactionDate,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeLocal,
                out var paidAt)
                ? paidAt.UtcDateTime
                : DateTime.UtcNow;
        }

        private static string BuildPendingNote(bool accountMatches, bool amountMatches, decimal expectedAmount, decimal actualAmount)
        {
            var notes = new List<string>();

            if (!accountMatches)
            {
                notes.Add("Tài khoản nhận tiền không khớp cấu hình Sepay.");
            }

            if (!amountMatches)
            {
                notes.Add($"Số tiền không khớp. Cần {expectedAmount:N0}, nhận {actualAmount:N0}.");
            }

            return string.Join(" ", notes);
        }
    }
}
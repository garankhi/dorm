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
            var existingPayment = await _context.Payments
                .Include(p => p.Invoice)
                .ThenInclude(i => i.Contract)
                .ThenInclude(c => c.Room)
                .FirstOrDefaultAsync(p => p.Provider == SepayProvider && p.ProviderTransactionId == providerTransactionId);

            if (existingPayment is not null)
            {
                if (existingPayment.Status == "confirmed")
                {
                    return Ok(new { success = true });
                }

                await using var existingTransaction = await _context.Database.BeginTransactionAsync();
                var duplicateNow = DateTime.UtcNow;
                var duplicateConfiguredAccount = ConfiguredSepayAccountNumber();
                var duplicateAccountMatches = MatchesConfiguredAccount(payload.AccountNumber, payload.SubAccount, duplicateConfiguredAccount);
                var duplicateAmountMatches = payload.TransferAmount == existingPayment.Invoice.Amount;
                var duplicateCanActivate = CanActivateContract(existingPayment.Invoice, out var duplicateActivationNote);

                if (duplicateAccountMatches && duplicateAmountMatches && duplicateCanActivate)
                {
                    existingPayment.Status = "confirmed";
                    existingPayment.ConfirmedAt = duplicateNow;
                    existingPayment.AdminNote = null;
                    existingPayment.UpdatedAt = duplicateNow;
                    ActivateInvoice(existingPayment.Invoice, duplicateNow);

                    await _context.SaveChangesAsync();
                    await existingTransaction.CommitAsync();
                }
                else
                {
                    existingPayment.AdminNote = BuildPendingNote(
                        duplicateAccountMatches,
                        duplicateAmountMatches,
                        existingPayment.Invoice.Amount,
                        payload.TransferAmount,
                        duplicateConfiguredAccount,
                        payload.AccountNumber,
                        payload.SubAccount);
                    if (!duplicateCanActivate)
                    {
                        existingPayment.AdminNote = string.IsNullOrWhiteSpace(existingPayment.AdminNote)
                            ? duplicateActivationNote
                            : $"{existingPayment.AdminNote} {duplicateActivationNote}";
                    }

                    existingPayment.UpdatedAt = duplicateNow;

                    await _context.SaveChangesAsync();
                    await existingTransaction.CommitAsync();

                    _logger.LogWarning(
                        "Sepay payment {ProviderTransactionId} still needs confirmation. AccountMatches={AccountMatches}, AmountMatches={AmountMatches}, CanActivate={CanActivate}, ReceivedAccount={ReceivedAccount}, ReceivedSubAccount={ReceivedSubAccount}, ConfiguredAccount={ConfiguredAccount}",
                        providerTransactionId,
                        duplicateAccountMatches,
                        duplicateAmountMatches,
                        duplicateCanActivate,
                        MaskAccount(payload.AccountNumber),
                        MaskAccount(payload.SubAccount),
                        MaskAccount(duplicateConfiguredAccount));
                }

                return Ok(new { success = true });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var invoice = await _context.Invoices
                .Include(i => i.Contract)
                .ThenInclude(c => c.Room)
                .FirstOrDefaultAsync(i => i.PaymentCode == payload.Code);
            if (invoice is null)
            {
                _logger.LogWarning("Sepay webhook ignored because payment code {PaymentCode} was not found.", payload.Code);
                return Ok(new { success = true });
            }

            var configuredAccount = ConfiguredSepayAccountNumber();
            var accountMatches = MatchesConfiguredAccount(payload.AccountNumber, payload.SubAccount, configuredAccount);
            var amountMatches = payload.TransferAmount == invoice.Amount;
            var confirmed = accountMatches && amountMatches;
            var now = DateTime.UtcNow;
            var pendingNote = BuildPendingNote(
                accountMatches,
                amountMatches,
                invoice.Amount,
                payload.TransferAmount,
                configuredAccount,
                payload.AccountNumber,
                payload.SubAccount);

            if (confirmed && !CanActivateContract(invoice, out var activationNote))
            {
                confirmed = false;
                pendingNote = string.IsNullOrWhiteSpace(pendingNote)
                    ? activationNote
                    : $"{pendingNote} {activationNote}";
            }

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
                AdminNote = confirmed ? null : pendingNote,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Payments.Add(payment);

            if (confirmed)
            {
                ActivateInvoice(invoice, now);
            }
            else if (invoice.Status == "unpaid")
            {
                invoice.Status = "pending_confirmation";
                invoice.UpdatedAt = now;
            }

            if (!confirmed)
            {
                _logger.LogWarning(
                    "Sepay webhook created pending payment for invoice {InvoiceId}. AccountMatches={AccountMatches}, AmountMatches={AmountMatches}, ReceivedAccount={ReceivedAccount}, ReceivedSubAccount={ReceivedSubAccount}, ConfiguredAccount={ConfiguredAccount}",
                    invoice.Id,
                    accountMatches,
                    amountMatches,
                    MaskAccount(payload.AccountNumber),
                    MaskAccount(payload.SubAccount),
                    MaskAccount(configuredAccount));
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

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

        private static bool CanActivateContract(Invoice invoice, out string pendingNote)
        {
            pendingNote = string.Empty;

            if (invoice.Contract.Status != "pending_payment")
            {
                return true;
            }

            var room = invoice.Contract.Room;

            if (room.Status is "maintenance" or "inactive")
            {
                pendingNote = "Phòng không còn khả dụng tại thời điểm xác nhận thanh toán.";
                return false;
            }

            if (room.CurrentOccupancy >= room.Capacity)
            {
                pendingNote = "Phòng không còn chỗ tại thời điểm xác nhận thanh toán.";
                return false;
            }

            return true;
        }

        private static void ActivateInvoice(Invoice invoice, DateTime now)
        {
            invoice.Status = "paid";
            invoice.UpdatedAt = now;

            if (invoice.Contract.Status != "pending_payment")
            {
                return;
            }

            var room = invoice.Contract.Room;

            invoice.Contract.Status = "active";
            invoice.Contract.UpdatedAt = now;
            room.CurrentOccupancy += 1;
            room.UpdatedAt = now;

            if (room.CurrentOccupancy >= room.Capacity)
            {
                room.Status = "full";
            }
        }

        private string ConfiguredSepayAccountNumber()
        {
            return NormalizeAccountNumber(_config["Sepay:AccountNumber"]);
        }

        private static bool MatchesConfiguredAccount(string accountNumber, string? subAccount, string configured)
        {
            if (string.IsNullOrWhiteSpace(configured)) return false;

            return NormalizeAccountNumber(accountNumber) == configured
                || NormalizeAccountNumber(subAccount) == configured;
        }

        private static string NormalizeAccountNumber(string? accountNumber)
        {
            return string.IsNullOrWhiteSpace(accountNumber)
                ? string.Empty
                : new string(accountNumber.Where(char.IsDigit).ToArray());
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

        private static string MaskAccount(string? accountNumber)
        {
            var normalized = NormalizeAccountNumber(accountNumber);
            if (string.IsNullOrWhiteSpace(normalized)) return "(empty)";
            if (normalized.Length <= 4) return new string('*', normalized.Length);

            return $"{new string('*', normalized.Length - 4)}{normalized[^4..]}";
        }

        private static string BuildPendingNote(
            bool accountMatches,
            bool amountMatches,
            decimal expectedAmount,
            decimal actualAmount,
            string configuredAccount,
            string receivedAccount,
            string? receivedSubAccount)
        {
            var notes = new List<string>();

            if (!accountMatches)
            {
                notes.Add($"Tài khoản nhận tiền không khớp cấu hình Sepay. Nhận {MaskAccount(receivedAccount)}, sub {MaskAccount(receivedSubAccount)}, cấu hình {MaskAccount(configuredAccount)}.");
            }

            if (!amountMatches)
            {
                notes.Add($"Số tiền không khớp. Cần {expectedAmount:N0}, nhận {actualAmount:N0}.");
            }

            return string.Join(" ", notes);
        }
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers
{
    [ApiController]
    [Route("api/invoices")]
    public class InvoicesController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public InvoicesController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpGet("me")]
        [Authorize(Policy = "RequireStudent")]
        public async Task<IActionResult> GetMyInvoices()
        {
            var currentStudentId = CurrentUserId();
            if (currentStudentId == null) return Unauthorized();

            var invoices = await _context.Invoices
                .Where(i => i.StudentId == currentStudentId.Value)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new StudentInvoiceResponse(
                    i.Id,
                    i.InvoiceCode,
                    i.PaymentCode,
                    i.BillingMonth,
                    i.BillingYear,
                    i.Amount,
                    i.DueDate,
                    i.Status
                ))
                .ToListAsync();

            return Ok(invoices);
        }

        [HttpGet("{invoiceId:guid}")]
        [Authorize(Policy = "RequireStudent")]
        public async Task<IActionResult> GetInvoiceById(Guid invoiceId)
        {
            var currentStudentId = CurrentUserId();
            if (currentStudentId == null) return Unauthorized();

            var invoice = await _context.Invoices
                .Where(i => i.Id == invoiceId && i.StudentId == currentStudentId.Value)
                .Select(i => new StudentInvoiceResponse(
                    i.Id,
                    i.InvoiceCode,
                    i.PaymentCode,
                    i.BillingMonth,
                    i.BillingYear,
                    i.Amount,
                    i.DueDate,
                    i.Status
                ))
                .FirstOrDefaultAsync();

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpPost("{invoiceId:guid}/sepay")]
        [Authorize(Policy = "RequireStudent")]
        public async Task<IActionResult> CreateInvoiceSepay(Guid invoiceId)
        {
            var currentStudentId = CurrentUserId();
            if (currentStudentId == null) return Unauthorized();

            var invoice = await _context.Invoices
                .Where(i => i.Id == invoiceId && i.StudentId == currentStudentId.Value)
                .FirstOrDefaultAsync();

            if (invoice == null)
            {
                return NotFound();
            }

            if (invoice.Status is "paid" or "cancelled")
            {
                return Conflict(new { message = "Hoá đơn đã được thanh toán hoặc hủy." });
            }

            if (string.IsNullOrWhiteSpace(invoice.PaymentCode))
            {
                invoice.PaymentCode = await NewPaymentCode();
                invoice.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var qrUrl = BuildSepayQrUrl(invoice.PaymentCode, invoice.Amount);

            return Ok(new SepayQrResponse(
                invoice.Id,
                invoice.Amount,
                invoice.PaymentCode,
                qrUrl
            ));
        }

        private Guid? CurrentUserId()
        {
            var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(sub, out var id) ? id : null;
        }

        private async Task<string> NewPaymentCode()
        {
            var prefix = _config["Sepay:PaymentCodePrefix"] ?? "HD";

            for (var attempt = 0; attempt < 5; attempt++)
            {
                var code = prefix + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

                var exists = await _context.Invoices.AnyAsync(i => i.PaymentCode == code);
                if (!exists)
                {
                    return code;
                }
            }

            throw new InvalidOperationException("Không thể tạo mã thanh toán mới sau nhiều lần thử.");
        }

        private string BuildSepayQrUrl(string paymentCode, decimal amount)
        {
            var bank = _config["Sepay:Bank"] ?? throw new InvalidOperationException("Sepay:Bank bị thiếu.");
            var accountNumber = _config["Sepay:AccountNumber"] ?? throw new InvalidOperationException("Sepay:AccountNumber bị thiếu.");
            var accountHolder = _config["Sepay:AccountHolder"] ?? "";
            var storeName = _config["Sepay:StoreName"] ?? "";

            return "https://vietqr.app/img"
                + $"?acc={Uri.EscapeDataString(accountNumber)}"
                + $"&bank={Uri.EscapeDataString(bank)}"
                + $"&amount={(long)amount}"
                + $"&des={Uri.EscapeDataString(paymentCode)}"
                + "&template=compact"
                + "&showinfo=true"
                + $"&holder={Uri.EscapeDataString(accountHolder)}"
                + $"&store={Uri.EscapeDataString(storeName)}";
        }
    }
}
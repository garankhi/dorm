using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ApplicationsController(AppDbContext db)
        {
            _db = db;
        }

        private Guid? CurrentUserId()
        {
            var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(sub, out var id) ? id : null;
        }

        [HttpGet("admin")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<ActionResult<AdminApplicationListResponse>> AdminList(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? building = null,
            [FromQuery] string? status = null,
            [FromQuery] string? q = null
        )
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = _db.DormApplications.Include(a => a.Student).Include(a => a.Room).AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(building) && building != "all")
            {
                query = query.Where(a => a.Room.BuildingName == building);
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = q.Trim().ToLower();
                query = query.Where(a =>
                a.Student.FullName.ToLower().Contains(keyword) ||
                a.Student.Email.ToLower().Contains(keyword) ||
                (a.Student.StudentCode != null && a.Student.StudentCode.ToLower().Contains(keyword)) ||
                a.Room.RoomNumber.ToLower().Contains(keyword) ||
                a.Room.BuildingName.ToLower().Contains(keyword));
            }

            var total = await query.CountAsync();

            var items = await query
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AdminDormApplicationResponse(
                a.Id,
                a.StudentId,
                a.Student.FullName,
                a.Student.StudentCode,
                a.Student.Email,
                a.Student.PhoneNumber,
                a.RoomId,
                a.Room.RoomNumber,
                a.Room.BuildingName,
                a.Reason,
                a.Status,
                a.SubmittedAt,
                a.ReviewedAt,
                a.ReviewedByUserId,
                a.AdminNote
            ))
            .ToListAsync();

            return Ok(new AdminApplicationListResponse(total, page, pageSize, items));
        }

        [HttpPatch("{id:guid}/approve")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Approve(Guid id, ReviewDormApplicationRequest req)
        {
            var adminId = CurrentUserId();
            if (adminId is null) return Unauthorized();

            await using var transaction = await _db.Database.BeginTransactionAsync();

            var application = await _db.DormApplications
                .Include(a => a.Room)
                .Include(a => a.Student)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application is null) return NotFound(new { error = "application_not_found" });
            if (application.Status != "pending") return Conflict(new { error = "application_not_pending" });

            var room = application.Room;
            if (room.Status is "maintenance" or "inactive" or "full")
                return Conflict(new { error = "room_not_available" });

            if (room.CurrentOccupancy >= room.Capacity)
                return Conflict(new { error = "room_full" });

            var hasOpenContract = await _db.Contracts.AnyAsync(c =>
                c.StudentId == application.StudentId &&
                (c.Status == "pending_payment" || c.Status == "active"));

            if (hasOpenContract)
                return Conflict(new { error = "student_already_has_open_contract" });

            var reservedCount = await _db.Contracts.CountAsync(c =>
                c.RoomId == room.Id && c.Status == "pending_payment");

            var availableSlots = room.Capacity - room.CurrentOccupancy - reservedCount;
            if (availableSlots <= 0)
                return Conflict(new { error = "room_no_available_slots" });

            var now = DateTime.UtcNow;
            var startDate = DateOnly.FromDateTime(now);
            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                StudentId = application.StudentId,
                RoomId = application.RoomId,
                ApplicationId = application.Id,
                StartDate = startDate,
                EndDate = startDate.AddMonths(6),
                MonthlyPrice = room.PricePerMonth,
                DepositAmount = 0,
                Status = "pending_payment",
                CreatedAt = now,
                UpdatedAt = now
            };

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                StudentId = application.StudentId,
                ContractId = contract.Id,
                InvoiceCode = await NewInvoiceCode(),
                BillingMonth = startDate.Month,
                BillingYear = startDate.Year,
                Amount = room.PricePerMonth,
                DueDate = startDate.AddDays(7),
                Status = "unpaid",
                CreatedAt = now,
                UpdatedAt = now
            };

            application.Status = "approved";
            application.AdminNote = string.IsNullOrWhiteSpace(req.AdminNote) ? application.AdminNote : req.AdminNote.Trim();
            application.ReviewedAt = now;
            application.ReviewedByUserId = adminId;
            application.UpdatedAt = now;

            _db.Contracts.Add(contract);
            _db.Invoices.Add(invoice);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                contractId = contract.Id,
                invoiceId = invoice.Id
            });
        }

        [HttpPatch("{id:guid}/reject")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Reject(Guid id, ReviewDormApplicationRequest req)
        {
            var adminId = CurrentUserId();
            if (adminId is null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(req.AdminNote))
                return BadRequest(new { error = "admin_note_required" });

            var application = await _db.DormApplications.FindAsync(id);
            if (application is null) return NotFound(new { error = "application_not_found" });
            if (application.Status != "pending") return Conflict(new { error = "application_not_pending" });

            application.Status = "rejected";
            application.AdminNote = req.AdminNote.Trim();
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = adminId.Value;
            application.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private async Task<string> NewInvoiceCode()
        {
            for (var attempt = 0; attempt < 5; attempt++)
            {
                var code = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                var exists = await _db.Invoices.AnyAsync(i => i.InvoiceCode == code);

                if (!exists)
                {
                    return code;
                }
            }

            throw new InvalidOperationException("Cannot generate a unique invoice code.");
        }
    }
}

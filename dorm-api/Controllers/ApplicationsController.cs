using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
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

            var application = await _db.DormApplications.FindAsync(id);
            if (application is null) return NotFound(new { error = "application_not_found" });
            if (application.Status != "pending") return Conflict(new { error = "application_not_pending" });

            application.Status = "approved";
            application.AdminNote = string.IsNullOrWhiteSpace(req.AdminNote) ? application.AdminNote : req.AdminNote.Trim();
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = adminId;
            application.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
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
    }
}
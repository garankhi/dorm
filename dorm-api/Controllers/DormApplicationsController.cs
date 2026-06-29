using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DormApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DormApplicationsController(AppDbContext db)
    {
        _db = db;
    }

    // POST: api/DormApplications
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CreateDormApplicationRequest req)
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(sub, out var studentId))
            return Unauthorized();

        var room = await _db.Rooms.FindAsync(req.RoomId);

        if (room == null)
            return NotFound(new { error = "room_not_found" });

        var student = await _db.AppUsers.FirstOrDefaultAsync(x => x.Id == studentId);

        if (student == null)
            return Unauthorized();

        if (student.Gender.ToString() != room.RoomGender.ToString())
        {
            return BadRequest(new { error = "Phòng này không phù hợp với giới tính của bạn." });
        }

        if (room.CurrentOccupancy >= room.Capacity)
            return BadRequest(new { error = "room_full" });

        var existed = await _db.DormApplications.AnyAsync(x =>
            x.StudentId == studentId &&
            (x.Status == "pending" || x.Status == "approved"));

        if (existed)
            return Conflict(new { error = "application_exists" });

        var application = new DormApplication
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            RoomId = req.RoomId,
            Reason = req.Reason,
            Status = "pending",
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.DormApplications.Add(application);
        await _db.SaveChangesAsync();

        return Ok(new DormApplicationResponse(
            application.Id,
            application.StudentId,
            application.RoomId,
            room.RoomNumber,    
            room.BuildingName,
            application.Reason,
            application.Status,
            application.SubmittedAt,
            application.ReviewedAt,
            application.ReviewedByUserId,
            application.AdminNote
        ));
    }

    // GET: api/DormApplications/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> MyApplications()
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(sub, out var studentId))
            return Unauthorized();

        var apps = await _db.DormApplications
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => new DormApplicationResponse(
                x.Id,
                x.StudentId,
                x.RoomId,
                x.Room.RoomNumber,
                x.Room.BuildingName,
                x.Reason,
                x.Status,
                x.SubmittedAt,
                x.ReviewedAt,
                x.ReviewedByUserId,
                x.AdminNote
            ))
            .ToListAsync();

        return Ok(apps);
    }

    // DELETE: api/DormApplications/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteApplication(Guid id)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(sub, out var studentId))
            return Unauthorized();

        var application = await _db.DormApplications
            .FirstOrDefaultAsync(x => x.Id == id && x.StudentId == studentId);

        if (application == null)
            return NotFound(new { error = "application_not_found" });

        if (application.Status != "pending")
            return BadRequest(new { error = "cannot_delete_non_pending_application" });

        _db.DormApplications.Remove(application);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
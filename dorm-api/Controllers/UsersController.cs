using System;
using System.Linq;
using System.Threading.Tasks;
using Dorm.Api.Data;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    private Guid? CurrentUserId()
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(sub, out var id)) return null;
        return id;
    }

    private bool IsAdmin()
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == "role" || c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        return string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase);
    }

    // Admin: list users with optional filters
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? role = null, [FromQuery] string? status = null, [FromQuery] string? q = null)
    {
        if (!IsAdmin()) return Forbid();

        var query = _db.AppUsers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(u => u.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(u => u.Email.Contains(q) || u.FullName.Contains(q) || (u.StudentCode != null && u.StudentCode.Contains(q)));
        }

        var total = await query.CountAsync();
        var items = await query.OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new {
                id = u.Id,
                email = u.Email,
                fullName = u.FullName,
                role = u.Role,
                status = u.Status,
                phoneNumber = u.PhoneNumber,
                studentCode = u.StudentCode,
                faculty = u.Faculty,
                className = u.ClassName,
                address = u.Address,
                createdAt = u.CreatedAt,
                updatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    // Admin: get user by id
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Get(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var u = await _db.AppUsers.FindAsync(id);
        if (u == null) return NotFound();

        return Ok(new {
            id = u.Id,
            email = u.Email,
            fullName = u.FullName,
            role = u.Role,
            status = u.Status,
            phoneNumber = u.PhoneNumber,
            studentCode = u.StudentCode,
            gender = u.Gender,
            dateOfBirth = u.DateOfBirth,
            faculty = u.Faculty,
            className = u.ClassName,
            address = u.Address,
            createdAt = u.CreatedAt,
            updatedAt = u.UpdatedAt
        });
    }

    public record AdminUpdateUserRequest(string? FullName = null, string? PhoneNumber = null, string? Role = null, string? Status = null, string? Faculty = null, string? ClassName = null, string? Address = null, string? Gender = null, DateOnly? DateOfBirth = null);

    // Admin: update user
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, AdminUpdateUserRequest req)
    {
        if (!IsAdmin()) return Forbid();

        var u = await _db.AppUsers.FindAsync(id);
        if (u == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FullName)) u.FullName = req.FullName;
        if (!string.IsNullOrWhiteSpace(req.PhoneNumber)) u.PhoneNumber = req.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(req.Faculty)) u.Faculty = req.Faculty;
        if (!string.IsNullOrWhiteSpace(req.ClassName)) u.ClassName = req.ClassName;
        if (!string.IsNullOrWhiteSpace(req.Address)) u.Address = req.Address;
        if (!string.IsNullOrWhiteSpace(req.Gender)) u.Gender = req.Gender;
        if (req.DateOfBirth.HasValue) u.DateOfBirth = req.DateOfBirth.Value;

        if (!string.IsNullOrWhiteSpace(req.Role)) u.Role = req.Role;
        if (!string.IsNullOrWhiteSpace(req.Status)) u.Status = req.Status;

        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // Admin: delete user (soft delete by setting status=deleted or hard delete)
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var u = await _db.AppUsers.FindAsync(id);
        if (u == null) return NotFound();

        // Prefer soft-delete
        u.Status = "deleted";
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}

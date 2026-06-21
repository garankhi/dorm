using System;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using Dorm.Api.Data;
using Dorm.Api.Models;
using Dorm.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;

    public AuthController(AppDbContext db, ITokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register-student")]
    public async Task<IActionResult> RegisterStudent(RegisterRequest req)
    {
        var exists = await _db.AppUsers.AnyAsync(u => u.Email == req.Email);
        if (exists) return Conflict(new { error = "email_exists" });

        var user = new AppUser
        {
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FullName = req.FullName,
            Role = "student",
            Status = "active",
            StudentCode = req.StudentCode
        };

        _db.AppUsers.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokens.CreateToken(user.Id, user.Email, user.Role);

        return Ok(new AuthResponse(token, user.Id, user.Email, user.FullName, user.Role));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null) return Unauthorized(new { error = "invalid_credentials" });

        bool ok;
        try
        {
            ok = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Log the invalid hash and treat as invalid credentials
            Console.WriteLine($"Invalid password hash for user {user.Email}");
            return Unauthorized(new { error = "invalid_credentials" });
        }
        if (!ok) return Unauthorized(new { error = "invalid_credentials" });

        var token = _tokens.CreateToken(user.Id, user.Email, user.Role);

        return Ok(new AuthResponse(token, user.Id, user.Email, user.FullName, user.Role));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(sub, out var id)) return Unauthorized();

        var user = await _db.AppUsers.FindAsync(id);
        if (user == null) return NotFound();

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            fullName = user.FullName,
            role = user.Role,
            phoneNumber = user.PhoneNumber,
            studentCode = user.StudentCode,
            gender = user.Gender,
            dateOfBirth = user.DateOfBirth,
            faculty = user.Faculty,
            className = user.ClassName,
            address = user.Address
        });
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe(UpdateProfileRequest req)
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                  ?? User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(sub, out var id)) return Unauthorized();

        var user = await _db.AppUsers.FindAsync(id);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FullName)) user.FullName = req.FullName;
        if (!string.IsNullOrWhiteSpace(req.PhoneNumber)) user.PhoneNumber = req.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(req.StudentCode)) user.StudentCode = req.StudentCode;
        if (!string.IsNullOrWhiteSpace(req.Faculty)) user.Faculty = req.Faculty;
        if (!string.IsNullOrWhiteSpace(req.ClassName)) user.ClassName = req.ClassName;
        if (!string.IsNullOrWhiteSpace(req.Address)) user.Address = req.Address;
        if (!string.IsNullOrWhiteSpace(req.Gender)) user.Gender = req.Gender;
        if (req.DateOfBirth.HasValue) user.DateOfBirth = req.DateOfBirth.Value;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            fullName = user.FullName,
            role = user.Role,
            phoneNumber = user.PhoneNumber,
            studentCode = user.StudentCode,
            gender = user.Gender,
            dateOfBirth = user.DateOfBirth,
            faculty = user.Faculty,
            className = user.ClassName,
            address = user.Address
        });
    }
}

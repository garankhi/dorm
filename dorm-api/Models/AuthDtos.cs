using System;

namespace Dorm.Api.Models
{
    public record RegisterRequest(string Email, string Password, string FullName, string? StudentCode = null);

    public record LoginRequest(string Email, string Password);

    public record AuthResponse(string Token, Guid Id, string Email, string FullName, string Role);

    public record UpdateProfileRequest(string? FullName = null, string? PhoneNumber = null, string? StudentCode = null, string? Faculty = null, string? ClassName = null, string? Address = null, string? Gender = null, DateOnly? DateOfBirth = null);
}

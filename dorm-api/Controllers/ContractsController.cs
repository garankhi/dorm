using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/contracts")]
public class ContractsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContractsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    [Authorize(Policy = "RequireStudent")]
    public async Task<IActionResult> GetMyContracts()
    {
        var currentStudentId = CurrentUserId();
        if (currentStudentId == null) return Unauthorized();

        var contracts = await _context.Contracts
            .Where(c => c.StudentId == currentStudentId.Value)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new StudentContractResponse(
                c.Id,
                c.RoomId,
                c.Room.BuildingName,
                c.Room.RoomNumber,
                c.StartDate,
                c.EndDate,
                c.MonthlyPrice,
                c.DepositAmount,
                c.Status
            ))
            .ToListAsync();

        return Ok(contracts);
    }

    private Guid? CurrentUserId()
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
            ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}

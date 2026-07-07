using Dorm.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RoomsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var rooms = await _context.Rooms
            .OrderBy(r => r.BuildingName)
            .ThenBy(r => r.RoomNumber)
            .Select(r => new
            {
                r.Id,
                r.BuildingName,
                r.RoomNumber,
                r.Floor,
                r.RoomType,
                r.Capacity,
                r.CurrentOccupancy,
                Reserved = r.Contracts.Count(c => c.Status == "pending_payment"),
                Available = r.Capacity - r.CurrentOccupancy - r.Contracts.Count(c => c.Status == "pending_payment"),
                r.PricePerMonth,
                r.Status,
                r.Description
            })
            .ToListAsync();

        return Ok(rooms);
    }
}

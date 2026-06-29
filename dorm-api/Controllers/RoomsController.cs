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

    // GET: api/rooms
    [HttpGet]
    public async Task<IActionResult> GetRooms([FromQuery] string? gender)
    {
        var query = _context.Rooms.AsQueryable();

        if (!string.IsNullOrEmpty(gender))
        {
            query = query.Where(x => x.RoomGender == gender.ToLower());
        }

        var rooms = await query
            .OrderBy(r => r.BuildingName)
            .ThenBy(r => r.RoomNumber)
            .Select(r => new
            {
                r.Id,
                r.BuildingName,
                r.RoomNumber,
                r.Floor,
                r.RoomType,
                r.RoomGender,
                r.Capacity,
                r.CurrentOccupancy,
                Available = r.Capacity - r.CurrentOccupancy,
                r.PricePerMonth,
                r.Status,
                r.Description
            })
            .ToListAsync();

        return Ok(rooms);
    }

    // GET: api/rooms/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoom(Guid id)
    {
        var room = await _context.Rooms
            .Where(r => r.Id == id)
            .Select(r => new
            {
                r.Id,
                r.BuildingName,
                r.RoomNumber,
                r.Floor,
                r.RoomGender,
                r.RoomType,
                r.Capacity,
                r.CurrentOccupancy,
                Available = r.Capacity - r.CurrentOccupancy,
                r.PricePerMonth,
                r.Status,
                r.Description,

                Amenities = _context.RoomTypeAmenities
                    .Where(x => x.RoomType == r.RoomType)
                    .Select(x => new
                    {
                        x.Amenity.Id,
                        x.Amenity.Name
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (room == null)
            return NotFound(new { error = "room_not_found" });

        return Ok(room);
    }
}
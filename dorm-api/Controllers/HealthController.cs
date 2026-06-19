using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Dorm.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Dorm.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _db;

        public HealthController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var utcNow = DateTime.UtcNow;
            var vietnamTime = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return Ok(new
            {
                status = "ok",
                service = "dorm-api",
                time = DateTime.UtcNow
            });
        }

        [HttpGet("db")]
        public async Task<IActionResult> GetDatabase()
        {
            var canConnect = await _db.Database.CanConnectAsync();

            if (!canConnect)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    status = "unhealthy",
                    database = "cannot connect"
                });
            }

            return Ok(new
            {
                status = "ok",
                database = "connected"
            });
        }
    }
}
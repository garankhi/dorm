using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Dorm.Api.Data;
using Dorm.Api.Dtos;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Controllers;

[ApiController]
[Route("api/maintenances")]
public class MaintenancesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly string _supabaseUrl;
    private readonly string _supabaseKey;
    private readonly string _supabaseBucket;

    public MaintenancesController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _supabaseUrl = config["Supabase:Url"] ?? "";
        _supabaseKey = config["Supabase:Key"] ?? "";
        _supabaseBucket = config["Supabase:BucketName"] ?? "maintenances";
    }

    private Guid? CurrentUserId()
    {
        var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
            ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private async Task AddHistoryAsync(Guid maintenanceId, string actorRole, Guid? actorUserId, string message)
    {
        _db.MaintenanceHistories.Add(new MaintenanceHistory
        {
            MaintenanceId = maintenanceId,
            ActorRole = actorRole,
            ActorUserId = actorUserId,
            Message = message,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    private async Task<string> UploadToSupabaseAsync(string filePath, string mimeType, Stream fileStream)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseKey}");
        client.DefaultRequestHeaders.Add("apiKey", _supabaseKey);

        var requestUrl = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{_supabaseBucket}/{filePath}";

        using var content = new StreamContent(fileStream);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);

        var response = await client.PostAsync(requestUrl, content);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"Supabase storage upload failed: {response.StatusCode} - {errorBody}");
        }

        // Return public URL
        return $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{_supabaseBucket}/{filePath}";
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<MaintenanceResponse>>> List([FromQuery] string? status)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.AppUsers.FindAsync(userId.Value);
        if (user is null) return Unauthorized();

        var query = _db.Maintenances
            .Include(x => x.Student)
            .Include(x => x.Room)
            .AsQueryable();

        if (user.Role == "student")
        {
            query = query.Where(x => x.StudentId == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            query = query.Where(x => x.Status == status);
        }

        var items = await query
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => new MaintenanceResponse
            {
                Id = x.Id,
                StudentId = x.StudentId,
                StudentName = x.Student.FullName,
                RoomId = x.RoomId,
                RoomNumber = x.Room.RoomNumber,
                BuildingName = x.Room.BuildingName,
                IssueType = x.IssueType,
                Severity = x.Severity,
                Status = x.Status,
                Description = x.Description,
                InternalNote = x.InternalNote,
                RejectionReason = x.RejectionReason,
                RoomUnderMaintenance = x.RoomUnderMaintenance,
                SubmittedAt = x.SubmittedAt,
                ResolvedAt = x.ResolvedAt,
                ConfirmedAt = x.ConfirmedAt,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Policy = "RequireStudent")]
    public async Task<ActionResult<MaintenanceResponse>> Create([FromBody] CreateMaintenance request)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var room = await _db.Rooms.FindAsync(request.RoomId);
        if (room is null) return NotFound(new { error = "room_not_found" });

        var entity = new Maintenance
        {
            StudentId = userId.Value,
            RoomId = request.RoomId,
            IssueType = request.IssueType,
            Severity = string.IsNullOrWhiteSpace(request.Severity) ? "medium" : request.Severity,
            Status = "submitted",
            Description = request.Description,
            RoomUnderMaintenance = false,
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Maintenances.Add(entity);
        await _db.SaveChangesAsync();

        await AddHistoryAsync(entity.Id, "student", userId.Value, "Sinh viên gửi yêu cầu bảo trì");

        return Ok(new MaintenanceResponse
        {
            Id = entity.Id,
            StudentId = entity.StudentId,
            StudentName = (await _db.AppUsers.FindAsync(userId.Value))!.FullName,
            RoomId = entity.RoomId,
            RoomNumber = room.RoomNumber,
            BuildingName = room.BuildingName,
            IssueType = entity.IssueType,
            Severity = entity.Severity,
            Status = entity.Status,
            Description = entity.Description,
            RoomUnderMaintenance = entity.RoomUnderMaintenance,
            SubmittedAt = entity.SubmittedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        });
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<MaintenanceResponse>> Detail(Guid id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.AppUsers.FindAsync(userId.Value);
        if (user is null) return Unauthorized();

        var entity = await _db.Maintenances
            .Include(x => x.Student)
            .Include(x => x.Room)
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity is null) return NotFound(new { error = "maintenance_not_found" });

        if (user.Role == "student" && entity.StudentId != userId.Value)
        {
            return Forbid();
        }

        return Ok(new MaintenanceResponse
        {
            Id = entity.Id,
            StudentId = entity.StudentId,
            StudentName = entity.Student.FullName,
            RoomId = entity.RoomId,
            RoomNumber = entity.Room.RoomNumber,
            BuildingName = entity.Room.BuildingName,
            IssueType = entity.IssueType,
            Severity = entity.Severity,
            Status = entity.Status,
            Description = entity.Description,
            InternalNote = entity.InternalNote,
            RejectionReason = entity.RejectionReason,
            RoomUnderMaintenance = entity.RoomUnderMaintenance,
            SubmittedAt = entity.SubmittedAt,
            ResolvedAt = entity.ResolvedAt,
            ConfirmedAt = entity.ConfirmedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            Attachments = entity.Attachments.Select(a => new MaintenanceAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                StoragePath = a.StoragePath,
                MimeType = a.MimeType,
                UploadedByUserId = a.UploadedByUserId,
                CreatedAt = a.CreatedAt
            }).ToList()
        });
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMaintenance request)
    {
        var entity = await _db.Maintenances.FindAsync(id);
        if (entity is null) return NotFound(new { error = "maintenance_not_found" });

        var messages = new List<string>();
        var previousStatus = entity.Status;

        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != entity.Status)
        {
            entity.Status = request.Status;
            messages.Add($"Admin thay đổi trạng thái từ {previousStatus} sang {entity.Status}");
        }

        if (!string.IsNullOrWhiteSpace(request.Severity) && request.Severity != entity.Severity)
        {
            entity.Severity = request.Severity;
            messages.Add("Admin cập nhật mức độ ưu tiên");
        }

        if (request.InternalNote is not null && request.InternalNote != entity.InternalNote)
        {
            entity.InternalNote = request.InternalNote;
            messages.Add("Admin cập nhật ghi chú nội bộ");
        }

        if (request.RejectionReason is not null && request.RejectionReason != entity.RejectionReason)
        {
            entity.RejectionReason = request.RejectionReason;
            messages.Add("Admin cập nhật lý do từ chối");
        }

        if (request.RoomUnderMaintenance is not null && request.RoomUnderMaintenance.Value != entity.RoomUnderMaintenance)
        {
            entity.RoomUnderMaintenance = request.RoomUnderMaintenance.Value;
            messages.Add("Admin cập nhật trạng thái phòng đang bảo trì");
        }

        if (entity.Status == "resolved") entity.ResolvedAt ??= DateTime.UtcNow;
        if (entity.Status == "closed") entity.ConfirmedAt ??= DateTime.UtcNow;

        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (messages.Count > 0)
        {
            await AddHistoryAsync(entity.Id, "admin", CurrentUserId(), string.Join("; ", messages));
        }

        return Ok(new { success = true });
    }

    [HttpGet("{id:guid}/history")]
    [Authorize]
    public async Task<ActionResult<List<MaintenanceHistoryResponse>>> History(Guid id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var maintenance = await _db.Maintenances.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (maintenance is null) return NotFound(new { error = "maintenance_not_found" });

        var user = await _db.AppUsers.FindAsync(userId.Value);
        if (user is null) return Unauthorized();

        if (user.Role == "student" && maintenance.StudentId != userId.Value)
        {
            return Forbid();
        }

        var items = await _db.MaintenanceHistories
            .AsNoTracking()
            .Where(x => x.MaintenanceId == id)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new MaintenanceHistoryResponse
            {
                Id = x.Id,
                ActorRole = x.ActorRole,
                Message = x.Message,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("{id:guid}/attachments")]
    [Authorize]
    public async Task<ActionResult<MaintenanceAttachmentResponse>> UploadAttachment(Guid id, IFormFile file)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var maintenance = await _db.Maintenances.FirstOrDefaultAsync(x => x.Id == id);
        if (maintenance is null) return NotFound(new { error = "maintenance_not_found" });

        var user = await _db.AppUsers.FindAsync(userId.Value);
        if (user is null) return Unauthorized();

        if (user.Role == "student" && maintenance.StudentId != userId.Value)
        {
            return Forbid();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "file_required" });
        }

        var extension = Path.GetExtension(file.FileName);
        var safeName = Path.GetFileNameWithoutExtension(file.FileName).Replace(" ", "_");
        var fileName = $"{id}/{safeName}-{Guid.NewGuid():N}{extension}";

        string publicUrl;
        try
        {
            using var stream = file.OpenReadStream();
            publicUrl = await UploadToSupabaseAsync(fileName, file.ContentType, stream);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "supabase_upload_failed", message = ex.Message });
        }

        var attachment = new MaintenanceAttachment
        {
            MaintenanceId = id,
            FileName = file.FileName,
            StoragePath = publicUrl,
            MimeType = file.ContentType,
            UploadedByUserId = userId.Value,
            CreatedAt = DateTime.UtcNow
        };

        _db.MaintenanceAttachments.Add(attachment);
        await _db.SaveChangesAsync();

        await AddHistoryAsync(id, user.Role, userId.Value, $"Đính kèm file {file.FileName}");

        return Ok(new MaintenanceAttachmentResponse
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            StoragePath = attachment.StoragePath,
            MimeType = attachment.MimeType,
            UploadedByUserId = attachment.UploadedByUserId,
            CreatedAt = attachment.CreatedAt
        });
    }

    [HttpGet("active-room")]
    [Authorize(Policy = "RequireStudent")]
    public async Task<IActionResult> GetActiveRoom()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var contract = await _db.Contracts
            .Include(c => c.Room)
            .FirstOrDefaultAsync(c => c.StudentId == userId.Value && c.Status == "active");

        if (contract is null)
        {
            // Fallback for testing/development: if student has no active contract, return the first available room
            var fallbackRoom = await _db.Rooms.FirstOrDefaultAsync(r => r.Status == "available");
            if (fallbackRoom is null)
            {
                return NotFound(new { error = "no_active_room" });
            }
            return Ok(new
            {
                RoomId = fallbackRoom.Id,
                RoomNumber = fallbackRoom.RoomNumber,
                BuildingName = fallbackRoom.BuildingName,
                IsFallback = true
            });
        }

        return Ok(new
        {
            RoomId = contract.RoomId,
            RoomNumber = contract.Room.RoomNumber,
            BuildingName = contract.Room.BuildingName
        });
    }

    [HttpPost("{id:guid}/comments")]
    [Authorize]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var maintenance = await _db.Maintenances.FirstOrDefaultAsync(x => x.Id == id);
        if (maintenance is null) return NotFound(new { error = "maintenance_not_found" });

        var user = await _db.AppUsers.FindAsync(userId.Value);
        if (user is null) return Unauthorized();

        if (user.Role == "student" && maintenance.StudentId != userId.Value)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "message_required" });
        }

        await AddHistoryAsync(id, user.Role, userId.Value, request.Message.Trim());
        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "RequireStudent")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var entity = await _db.Maintenances.FindAsync(id);
        if (entity is null) return NotFound(new { error = "maintenance_not_found" });

        if (entity.StudentId != userId.Value) return Forbid();

        if (entity.Status != "submitted")
        {
            return BadRequest(new { error = "cannot_cancel_already_processed" });
        }

        entity.Status = "closed";
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await AddHistoryAsync(id, "student", userId.Value, "Sinh viên hủy yêu cầu sửa chữa");

        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/confirm")]
    [Authorize(Policy = "RequireStudent")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var entity = await _db.Maintenances.FindAsync(id);
        if (entity is null) return NotFound(new { error = "maintenance_not_found" });

        if (entity.StudentId != userId.Value) return Forbid();

        if (entity.Status != "resolved")
        {
            return BadRequest(new { error = "ticket_not_resolved" });
        }

        entity.Status = "closed";
        entity.ConfirmedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await AddHistoryAsync(id, "student", userId.Value, "Sinh viên xác nhận đã sửa xong và đóng yêu cầu");

        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/reopen")]
    [Authorize(Policy = "RequireStudent")]
    public async Task<IActionResult> Reopen(Guid id, [FromBody] AddCommentRequest request)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var entity = await _db.Maintenances.FindAsync(id);
        if (entity is null) return NotFound(new { error = "maintenance_not_found" });

        if (entity.StudentId != userId.Value) return Forbid();

        if (entity.Status != "resolved")
        {
            return BadRequest(new { error = "ticket_not_resolved" });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "reason_required" });
        }

        entity.Status = "reopened";
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await AddHistoryAsync(id, "student", userId.Value, $"⚠ Sinh viên báo lỗi chưa khắc phục xong. Yêu cầu sửa lại. Lý do: {request.Message.Trim()}");

        return Ok(new { success = true });
    }
}

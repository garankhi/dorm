using System;

namespace Dorm.Api.Models;

public class MaintenanceAttachment
{
    public Guid Id { get; set; }

    public Guid MaintenanceId { get; set; }

    public string FileName { get; set; } = null!;

    public string StoragePath { get; set; } = null!;

    public string? MimeType { get; set; }

    public Guid? UploadedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Maintenance Maintenance { get; set; } = null!;

    public virtual AppUser? UploadedByUser { get; set; }
}

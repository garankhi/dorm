using System;
using System.Collections.Generic;

namespace Dorm.Api.Dtos;

public class CreateMaintenance
{
    public Guid RoomId { get; set; }
    public string IssueType { get; set; } = null!;
    public string? Severity { get; set; }
    public string Description { get; set; } = null!;
}

public class UpdateMaintenance
{
    public string? Status { get; set; }
    public string? Severity { get; set; }
    public string? InternalNote { get; set; }
    public string? RejectionReason { get; set; }
    public bool? RoomUnderMaintenance { get; set; }
}

public class MaintenanceResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = "";
    public string BuildingName { get; set; } = "";
    public string IssueType { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Status { get; set; } = "";
    public string Description { get; set; } = "";
    public string? InternalNote { get; set; }
    public string? RejectionReason { get; set; }
    public bool RoomUnderMaintenance { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<MaintenanceAttachmentResponse> Attachments { get; set; } = new();
}

public class MaintenanceHistoryResponse
{
    public Guid Id { get; set; }
    public string ActorRole { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class MaintenanceAttachmentResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = "";
    public string StoragePath { get; set; } = "";
    public string? MimeType { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AddCommentRequest
{
    public string Message { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public class Maintenance
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid RoomId { get; set; }

    public Guid? AssignedAdminId { get; set; }

    public string IssueType { get; set; } = null!;

    public string Severity { get; set; } = "medium";

    public string Status { get; set; } = "submitted";

    public string Description { get; set; } = null!;

    public string? InternalNote { get; set; }

    public string? RejectionReason { get; set; }

    public bool RoomUnderMaintenance { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual AppUser Student { get; set; } = null!;

    public virtual Room Room { get; set; } = null!;

    public virtual AppUser? AssignedAdmin { get; set; }

    public virtual ICollection<MaintenanceAttachment> Attachments { get; set; } = new List<MaintenanceAttachment>();

    public virtual ICollection<MaintenanceHistory> History { get; set; } = new List<MaintenanceHistory>();
}

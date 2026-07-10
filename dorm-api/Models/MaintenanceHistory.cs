using System;

namespace Dorm.Api.Models;

public class MaintenanceHistory
{
    public Guid Id { get; set; }

    public Guid MaintenanceId { get; set; }

    public string ActorRole { get; set; } = null!;

    public Guid? ActorUserId { get; set; }

    public string Message { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Maintenance Maintenance { get; set; } = null!;

    public virtual AppUser? ActorUser { get; set; }
}

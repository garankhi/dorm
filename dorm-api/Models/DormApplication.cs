using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class DormApplication
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid RoomId { get; set; }

    public string? Reason { get; set; }

    public string Status { get; set; } = null!;

    public string? AdminNote { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public Guid? ReviewedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Contract? Contract { get; set; }

    public virtual AppUser? ReviewedByUser { get; set; }

    public virtual Room Room { get; set; } = null!;

    public virtual AppUser Student { get; set; } = null!;
}

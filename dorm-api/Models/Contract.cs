using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class Contract
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid RoomId { get; set; }

    public Guid ApplicationId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal MonthlyPrice { get; set; }

    public decimal DepositAmount { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? TerminatedAt { get; set; }

    public string? TerminationReason { get; set; }

    public virtual DormApplication Application { get; set; } = null!;

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual Room Room { get; set; } = null!;

    public virtual AppUser Student { get; set; } = null!;
}

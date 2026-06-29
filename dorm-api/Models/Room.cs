using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class Room
{
    public Guid Id { get; set; }

    public string BuildingName { get; set; } = null!;

    public string RoomNumber { get; set; } = null!;

    public int Floor { get; set; }

    public int Capacity { get; set; }

    public int CurrentOccupancy { get; set; }

    public decimal PricePerMonth { get; set; }

    public string Status { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<DormApplication> DormApplications { get; set; } = new List<DormApplication>();
}

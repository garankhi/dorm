using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class AppUser
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string Role { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? StudentCode { get; set; }

    public string? Gender { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? Faculty { get; set; }

    public string? ClassName { get; set; }

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<DormApplication> DormApplicationReviewedByUsers { get; set; } = new List<DormApplication>();

    public virtual ICollection<DormApplication> DormApplicationStudents { get; set; } = new List<DormApplication>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<Maintenance> Maintenances { get; set; } = new List<Maintenance>();

    public virtual ICollection<MaintenanceAttachment> MaintenanceAttachments { get; set; } = new List<MaintenanceAttachment>();

    public virtual ICollection<MaintenanceHistory> MaintenanceHistories { get; set; } = new List<MaintenanceHistory>();

    public virtual ICollection<Payment> PaymentConfirmedByUsers { get; set; } = new List<Payment>();

    public virtual ICollection<Payment> PaymentStudents { get; set; } = new List<Payment>();
}

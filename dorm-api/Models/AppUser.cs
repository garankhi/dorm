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

    public virtual Contract? Contract { get; set; }

    public virtual ICollection<DormApplication> DormApplicationReviewedByUsers { get; set; } = new List<DormApplication>();

    public virtual DormApplication? DormApplicationStudent { get; set; }

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<Payment> PaymentConfirmedByUsers { get; set; } = new List<Payment>();

    public virtual ICollection<Payment> PaymentStudents { get; set; } = new List<Payment>();
}

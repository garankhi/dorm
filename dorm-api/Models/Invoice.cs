using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class Invoice
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid ContractId { get; set; }

    public string InvoiceCode { get; set; } = null!;

    public int BillingMonth { get; set; }

    public int BillingYear { get; set; }

    public decimal Amount { get; set; }

    public DateOnly DueDate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? PaymentCode { get; set; }

    public virtual Contract Contract { get; set; } = null!;

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual AppUser Student { get; set; } = null!;
}

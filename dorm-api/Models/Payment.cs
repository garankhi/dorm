using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class Payment
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }

    public Guid StudentId { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public string? ProofUrl { get; set; }

    public string Status { get; set; } = null!;

    public DateTime PaidAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public Guid? ConfirmedByUserId { get; set; }

    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? Provider { get; set; }

    public string? ProviderTransactionId { get; set; }

    public string? ProviderReferenceCode { get; set; }

    public string? ProviderPayload { get; set; }

    public virtual AppUser? ConfirmedByUser { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual AppUser Student { get; set; } = null!;
}

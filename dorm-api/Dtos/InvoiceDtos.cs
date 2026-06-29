namespace Dorm.Api.Dtos
{
    public record StudentInvoiceResponse(
        Guid Id,
        string InvoiceCode,
        string? PaymentCode,
        int BillingMonth,
        int BillingYear,
        decimal Amount,
        DateOnly DueDate,
        string status
    );

    public record SepayQrResponse(
        Guid InvoiceId,
        decimal Amount,
        string PaymentCode,
        string QrUrl
    );

    public record SepayWebhookRequest(
        long Id,
        string Gateway,
        string TransactionDate,
        string AccountNumber,
        string? SubAccount,
        string? Code,
        string Content,
        string TransferType,
        string? Description,
        decimal TransferAmount,
        decimal Accumulated,
        string? ReferenceCode
    );
}
using System;

namespace Dorm.Api.Dtos
{
    public record CreateDormApplicationRequest(Guid RoomId, string? Reason = null);

    public record DormApplicationResponse(Guid Id, Guid StudentId, Guid RoomId, string? Reason, string Status, DateTime SubmittedAt, DateTime? ReviewedAt, Guid? ReviewedByUserId, string? AdminNote);

    public record AdminDormApplicationResponse(Guid Id, Guid StudentId, string StudentName, string? StudentCode, string Email, string? PhoneNumber, Guid RoomId, string Room, string Building, string? Reason, string Status, DateTime SubmittedAt, DateTime? ReviewedAt, Guid? ReviewedByUserId, string? AdminNote);

    public record AdminApplicationListResponse(int Total, int Page, int PageSize, IReadOnlyList<AdminDormApplicationResponse> Items);

    public record ReviewDormApplicationRequest(string? AdminNote);
}

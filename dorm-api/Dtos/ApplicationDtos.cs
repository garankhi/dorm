using System;

namespace Dorm.Api.Dtos
{
    public record CreateDormApplicationRequest(Guid RoomId, string? Reason = null);

    public record DormApplicationResponse(Guid Id, Guid StudentId, Guid RoomId, string? Reason, string Status, DateTime SubmittedAt, DateTime? ReviewedAt, Guid? ReviewedByUserId, string? AdminNote);
}

namespace Dorm.Api.Dtos;

public record StudentContractResponse(
    Guid Id,
    Guid RoomId,
    string BuildingName,
    string RoomNumber,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal MonthlyPrice,
    decimal DepositAmount,
    string Status
);

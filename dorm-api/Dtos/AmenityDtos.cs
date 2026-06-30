namespace Dorm.Api.Dtos
{
    public record AmenityDto(Guid Id, string Name);

    public record RoomDetailResponse(
        Guid Id, 
        string Name, 
        string Building, 
        int Capacity, 
        int Available, 
        string Type, 
        int Floor, 
        decimal Price,
        List<AmenityDto> Amenities
    );
}
using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class RoomTypeAmenity
{
    public string RoomType { get; set; } = null!;
    public Guid AmenityId { get; set; }

    public virtual Amenity Amenity { get; set; } = null!;
}

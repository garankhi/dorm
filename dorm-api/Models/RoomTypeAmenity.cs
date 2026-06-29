using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class RoomTypeAmenity
{
    public Guid AmenityId { get; set; }

    public virtual Amenity Amenity { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace Dorm.Api.Models;

public partial class Amenity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}

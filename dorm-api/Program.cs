using System.Text;
using Dorm.Api.Data;
using Dorm.Api.Hubs;
using Dorm.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000", "http://127.0.0.1:3000" };
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "dorm-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "dorm-web";

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("Jwt:Key is not configured.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontEnd", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwtKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy =>
    policy.RequireRole("admin"));

    options.AddPolicy("RequireStudent", policy => 
    policy.RequireRole("student"));
});
builder.Services.AddScoped<Dorm.Api.Services.ITokenService, Dorm.Api.Services.TokenService>();
builder.Services.AddOpenApi();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await SeedDemoUsersAsync(db, builder.Configuration);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontEnd");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MaintenanceHub>("/hubs/maintenance");

app.Run();

static async Task SeedDemoUsersAsync(AppDbContext db, IConfiguration configuration)
{
    var adminEmail = configuration["Demo:AdminEmail"] ?? "admin@sdms.local";
    var adminPassword = configuration["Demo:AdminPassword"] ?? "Admin123!";
    var studentEmail = configuration["Demo:StudentEmail"] ?? "student@sdms.local";
    var studentPassword = configuration["Demo:StudentPassword"] ?? "Student123!";

    if (!await db.AppUsers.AnyAsync(user => user.Email == adminEmail))
    {
        db.AppUsers.Add(new AppUser
        {
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            FullName = "Admin Demo",
            Role = "admin",
            Status = "active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    if (!await db.AppUsers.AnyAsync(user => user.Email == studentEmail))
    {
        db.AppUsers.Add(new AppUser
        {
            Email = studentEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(studentPassword),
            FullName = "Student Demo",
            Role = "student",
            Status = "active",
            StudentCode = "SV001",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    await db.SaveChangesAsync();
}
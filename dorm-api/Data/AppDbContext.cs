using System;
using System.Collections.Generic;
using Dorm.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Api.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Amenity> Amenities { get; set; }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<DormApplication> DormApplications { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Room> Rooms { get; set; }

    public virtual DbSet<RoomTypeAmenity> RoomTypeAmenities { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("auth", "aal_level", new[] { "aal1", "aal2", "aal3" })
            .HasPostgresEnum("auth", "code_challenge_method", new[] { "s256", "plain" })
            .HasPostgresEnum("auth", "factor_status", new[] { "unverified", "verified" })
            .HasPostgresEnum("auth", "factor_type", new[] { "totp", "webauthn", "phone" })
            .HasPostgresEnum("auth", "oauth_authorization_status", new[] { "pending", "approved", "denied", "expired" })
            .HasPostgresEnum("auth", "oauth_client_type", new[] { "public", "confidential" })
            .HasPostgresEnum("auth", "oauth_registration_type", new[] { "dynamic", "manual" })
            .HasPostgresEnum("auth", "oauth_response_type", new[] { "code" })
            .HasPostgresEnum("auth", "one_time_token_type", new[] { "confirmation_token", "reauthentication_token", "recovery_token", "email_change_token_new", "email_change_token_current", "phone_change_token" })
            .HasPostgresEnum("net", "request_status", new[] { "PENDING", "SUCCESS", "ERROR" })
            .HasPostgresEnum("realtime", "action", new[] { "INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR" })
            .HasPostgresEnum("realtime", "equality_op", new[] { "eq", "neq", "lt", "lte", "gt", "gte", "in", "like", "ilike", "is", "match", "imatch", "isdistinct" })
            .HasPostgresEnum("room_gender_enum", new[] { "male", "female" })
            .HasPostgresEnum("room_type_enum", new[] { "room_2", "room_4", "room_6", "room_8" })
            .HasPostgresEnum("storage", "buckettype", new[] { "STANDARD", "ANALYTICS", "VECTOR" })
            .HasPostgresExtension("extensions", "pg_net")
            .HasPostgresExtension("extensions", "pg_stat_statements")
            .HasPostgresExtension("extensions", "pgcrypto")
            .HasPostgresExtension("extensions", "uuid-ossp")
            .HasPostgresExtension("vault", "supabase_vault");

        modelBuilder.Entity<Amenity>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("amenities_pkey");

            entity.ToTable("amenities");

            entity.HasIndex(e => e.Name, "amenities_name_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.Name).HasColumnName("name");
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("app_users_pkey");

            entity.ToTable("app_users");

            entity.HasIndex(e => e.Email, "app_users_email_key").IsUnique();

            entity.HasIndex(e => new { e.Role, e.Status }, "app_users_role_status_idx");

            entity.HasIndex(e => e.StudentCode, "app_users_student_code_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.ClassName).HasColumnName("class_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.Faculty).HasColumnName("faculty");
            entity.Property(e => e.FullName).HasColumnName("full_name");
            entity.Property(e => e.Gender).HasColumnName("gender");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'active'::text")
                .HasColumnName("status");
            entity.Property(e => e.StudentCode).HasColumnName("student_code");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("contracts_pkey");

            entity.ToTable("contracts");

            entity.HasIndex(e => e.ApplicationId, "contracts_application_id_key").IsUnique();

            entity.HasIndex(e => e.StudentId, "contracts_one_active_per_student")
                .IsUnique()
                .HasFilter("(status = 'active'::text)");

            entity.HasIndex(e => new { e.StudentId, e.Status }, "contracts_student_status_idx");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.ApplicationId).HasColumnName("application_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.DepositAmount)
                .HasPrecision(12, 2)
                .HasColumnName("deposit_amount");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPrice)
                .HasPrecision(12, 2)
                .HasColumnName("monthly_price");
            entity.Property(e => e.RoomId).HasColumnName("room_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'active'::text")
                .HasColumnName("status");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.TerminatedAt).HasColumnName("terminated_at");
            entity.Property(e => e.TerminationReason).HasColumnName("termination_reason");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Application).WithOne(p => p.Contract)
                .HasForeignKey<Contract>(d => d.ApplicationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("contracts_application_id_fkey");

            entity.HasOne(d => d.Room).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("contracts_room_id_fkey");

            entity.HasOne(d => d.Student).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("contracts_student_id_fkey");
        });

        modelBuilder.Entity<DormApplication>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("dorm_applications_pkey");

            entity.ToTable("dorm_applications");

            entity.HasIndex(e => e.StudentId, "dorm_applications_one_pending_per_student")
                .IsUnique()
                .HasFilter("(status = 'pending'::text)");

            entity.HasIndex(e => new { e.Status, e.SubmittedAt }, "dorm_applications_status_submitted_idx").IsDescending(false, true);

            entity.HasIndex(e => new { e.StudentId, e.SubmittedAt }, "dorm_applications_student_idx").IsDescending(false, true);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AdminNote).HasColumnName("admin_note");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(e => e.ReviewedByUserId).HasColumnName("reviewed_by_user_id");
            entity.Property(e => e.RoomId).HasColumnName("room_id");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending'::text")
                .HasColumnName("status");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("submitted_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.DormApplicationReviewedByUsers)
                .HasForeignKey(d => d.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("dorm_applications_reviewed_by_user_id_fkey");

            entity.HasOne(d => d.Room).WithMany(p => p.DormApplications)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("dorm_applications_room_id_fkey");

            entity.HasOne(d => d.Student).WithMany(p => p.DormApplicationStudents)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("dorm_applications_student_id_fkey");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("invoices_pkey");

            entity.ToTable("invoices");

            entity.HasIndex(e => e.ContractId, "invoices_contract_idx");

            entity.HasIndex(e => e.InvoiceCode, "invoices_invoice_code_key").IsUnique();

            entity.HasIndex(e => e.PaymentCode, "invoices_payment_code_key").IsUnique();

            entity.HasIndex(e => new { e.StudentId, e.Status, e.CreatedAt }, "invoices_student_status_idx").IsDescending(false, false, true);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.BillingMonth).HasColumnName("billing_month");
            entity.Property(e => e.BillingYear).HasColumnName("billing_year");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.InvoiceCode).HasColumnName("invoice_code");
            entity.Property(e => e.PaymentCode).HasColumnName("payment_code");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'unpaid'::text")
                .HasColumnName("status");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Contract).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("invoices_contract_id_fkey");

            entity.HasOne(d => d.Student).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("invoices_student_id_fkey");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("payments_pkey");

            entity.ToTable("payments");

            entity.HasIndex(e => new { e.InvoiceId, e.Status }, "payments_invoice_status_idx");

            entity.HasIndex(e => e.ProviderTransactionId, "payments_provider_transaction_id_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AdminNote).HasColumnName("admin_note");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
            entity.Property(e => e.ConfirmedByUserId).HasColumnName("confirmed_by_user_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.PaidAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("paid_at");
            entity.Property(e => e.PaymentMethod)
                .HasDefaultValueSql("'cash'::text")
                .HasColumnName("payment_method");
            entity.Property(e => e.ProofUrl).HasColumnName("proof_url");
            entity.Property(e => e.Provider).HasColumnName("provider");
            entity.Property(e => e.ProviderPayload)
                .HasColumnType("jsonb")
                .HasColumnName("provider_payload");
            entity.Property(e => e.ProviderReferenceCode).HasColumnName("provider_reference_code");
            entity.Property(e => e.ProviderTransactionId).HasColumnName("provider_transaction_id");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending_confirmation'::text")
                .HasColumnName("status");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.ConfirmedByUser).WithMany(p => p.PaymentConfirmedByUsers)
                .HasForeignKey(d => d.ConfirmedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("payments_confirmed_by_user_id_fkey");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("payments_invoice_id_fkey");

            entity.HasOne(d => d.Student).WithMany(p => p.PaymentStudents)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("payments_student_id_fkey");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("rooms_pkey");

            entity.ToTable("rooms");

            entity.HasIndex(e => new { e.BuildingName, e.RoomNumber }, "rooms_building_room_unique").IsUnique();

            entity.HasIndex(e => new { e.Status, e.CurrentOccupancy, e.Capacity }, "rooms_status_capacity_idx");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.BuildingName).HasColumnName("building_name");
            entity.Property(e => e.Capacity).HasColumnName("capacity");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.CurrentOccupancy).HasColumnName("current_occupancy");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Floor)
                .HasDefaultValue(1)
                .HasColumnName("floor");
            entity.Property(e => e.PricePerMonth)
                .HasPrecision(12, 2)
                .HasColumnName("price_per_month");
            entity.Property(e => e.RoomNumber).HasColumnName("room_number");
            entity.Property(e => e.RoomType)
                .HasDefaultValueSql("'room_4'::room_type_enum")
                .HasColumnName("room_type");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'available'::text")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at");
            entity.Property(e => e.RoomGender)
                .HasDefaultValueSql("'unisex'::text")
                .HasColumnName("room_gender");
        });

        modelBuilder.Entity<RoomTypeAmenity>(entity =>
        {
            entity.ToTable("room_type_amenities", "public");

            entity.HasKey(e => new { e.RoomType, e.AmenityId });

            entity.Property(e => e.RoomType)
                .HasColumnName("room_type");

            entity.Property(e => e.AmenityId)
                .HasColumnName("amenity_id");

            entity.HasOne(d => d.Amenity)
                .WithMany()
                .HasForeignKey(d => d.AmenityId)
                .HasConstraintName("room_type_amenities_amenity_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dorm.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:auth.aal_level", "aal1,aal2,aal3")
                .Annotation("Npgsql:Enum:auth.code_challenge_method", "s256,plain")
                .Annotation("Npgsql:Enum:auth.factor_status", "unverified,verified")
                .Annotation("Npgsql:Enum:auth.factor_type", "totp,webauthn,phone")
                .Annotation("Npgsql:Enum:auth.oauth_authorization_status", "pending,approved,denied,expired")
                .Annotation("Npgsql:Enum:auth.oauth_client_type", "public,confidential")
                .Annotation("Npgsql:Enum:auth.oauth_registration_type", "dynamic,manual")
                .Annotation("Npgsql:Enum:auth.oauth_response_type", "code")
                .Annotation("Npgsql:Enum:auth.one_time_token_type", "confirmation_token,reauthentication_token,recovery_token,email_change_token_new,email_change_token_current,phone_change_token")
                .Annotation("Npgsql:Enum:net.request_status", "PENDING,SUCCESS,ERROR")
                .Annotation("Npgsql:Enum:realtime.action", "INSERT,UPDATE,DELETE,TRUNCATE,ERROR")
                .Annotation("Npgsql:Enum:realtime.equality_op", "eq,neq,lt,lte,gt,gte,in,like,ilike,is,match,imatch,isdistinct")
                .Annotation("Npgsql:Enum:room_gender_enum", "male,female")
                .Annotation("Npgsql:Enum:room_type_enum", "room_2,room_4,room_6,room_8")
                .Annotation("Npgsql:Enum:storage.buckettype", "STANDARD,ANALYTICS,VECTOR")
                .Annotation("Npgsql:PostgresExtension:extensions.pg_net", ",,")
                .Annotation("Npgsql:PostgresExtension:extensions.pg_stat_statements", ",,")
                .Annotation("Npgsql:PostgresExtension:extensions.pgcrypto", ",,")
                .Annotation("Npgsql:PostgresExtension:extensions.uuid-ossp", ",,")
                .Annotation("Npgsql:PostgresExtension:vault.supabase_vault", ",,");

            migrationBuilder.CreateTable(
                name: "amenities",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("amenities_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'active'::text"),
                    student_code = table.Column<string>(type: "text", nullable: true),
                    gender = table.Column<string>(type: "text", nullable: true),
                    date_of_birth = table.Column<DateOnly>(type: "date", nullable: true),
                    faculty = table.Column<string>(type: "text", nullable: true),
                    class_name = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("app_users_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "rooms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    building_name = table.Column<string>(type: "text", nullable: false),
                    room_number = table.Column<string>(type: "text", nullable: false),
                    floor = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    room_type = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'room_4'::room_type_enum"),
                    capacity = table.Column<int>(type: "integer", nullable: false),
                    current_occupancy = table.Column<int>(type: "integer", nullable: false),
                    price_per_month = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'available'::text"),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    room_gender = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'unisex'::text")
                },
                constraints: table =>
                {
                    table.PrimaryKey("rooms_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "room_type_amenities",
                schema: "public",
                columns: table => new
                {
                    room_type = table.Column<string>(type: "text", nullable: false),
                    amenity_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_room_type_amenities", x => new { x.room_type, x.amenity_id });
                    table.ForeignKey(
                        name: "room_type_amenities_amenity_id_fkey",
                        column: x => x.amenity_id,
                        principalTable: "amenities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "dorm_applications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'pending'::text"),
                    admin_note = table.Column<string>(type: "text", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reviewed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("dorm_applications_pkey", x => x.id);
                    table.ForeignKey(
                        name: "dorm_applications_reviewed_by_user_id_fkey",
                        column: x => x.reviewed_by_user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "dorm_applications_room_id_fkey",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "dorm_applications_student_id_fkey",
                        column: x => x.student_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "maintenances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    issue_type = table.Column<string>(type: "text", nullable: false),
                    severity = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'medium'::text"),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'submitted'::text"),
                    description = table.Column<string>(type: "text", nullable: false),
                    internal_note = table.Column<string>(type: "text", nullable: true),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    room_under_maintenance = table.Column<bool>(type: "boolean", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                },
                constraints: table =>
                {
                    table.PrimaryKey("maintenances_pkey", x => x.id);
                    table.ForeignKey(
                        name: "maintenances_assigned_admin_id_fkey",
                        column: x => x.assigned_admin_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "maintenances_room_id_fkey",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "maintenances_student_id_fkey",
                        column: x => x.student_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contracts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    application_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    monthly_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'active'::text"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    terminated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    termination_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("contracts_pkey", x => x.id);
                    table.ForeignKey(
                        name: "contracts_application_id_fkey",
                        column: x => x.application_id,
                        principalTable: "dorm_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "contracts_room_id_fkey",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "contracts_student_id_fkey",
                        column: x => x.student_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    maintenance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    storage_path = table.Column<string>(type: "text", nullable: false),
                    mime_type = table.Column<string>(type: "text", nullable: true),
                    uploaded_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    AppUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("maintenance_attachments_pkey", x => x.id);
                    table.ForeignKey(
                        name: "maintenance_attachments_maintenance_id_fkey",
                        column: x => x.maintenance_id,
                        principalTable: "maintenances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "maintenance_attachments_uploaded_by_user_id_fkey",
                        column: x => x.uploaded_by_user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_histories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    maintenance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_role = table.Column<string>(type: "text", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    message = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    AppUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("maintenance_histories_pkey", x => x.id);
                    table.ForeignKey(
                        name: "FK_maintenance_histories_app_users_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "app_users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "maintenance_histories_actor_user_id_fkey",
                        column: x => x.actor_user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "maintenance_histories_maintenance_id_fkey",
                        column: x => x.maintenance_id,
                        principalTable: "maintenances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    contract_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_code = table.Column<string>(type: "text", nullable: false),
                    billing_month = table.Column<int>(type: "integer", nullable: false),
                    billing_year = table.Column<int>(type: "integer", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    due_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'unpaid'::text"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    payment_code = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("invoices_pkey", x => x.id);
                    table.ForeignKey(
                        name: "invoices_contract_id_fkey",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "invoices_student_id_fkey",
                        column: x => x.student_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    payment_method = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'cash'::text"),
                    proof_url = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'pending_confirmation'::text"),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    confirmed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    admin_note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    provider = table.Column<string>(type: "text", nullable: true),
                    provider_transaction_id = table.Column<string>(type: "text", nullable: true),
                    provider_reference_code = table.Column<string>(type: "text", nullable: true),
                    provider_payload = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("payments_pkey", x => x.id);
                    table.ForeignKey(
                        name: "payments_confirmed_by_user_id_fkey",
                        column: x => x.confirmed_by_user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "payments_invoice_id_fkey",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "payments_student_id_fkey",
                        column: x => x.student_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "amenities_name_key",
                table: "amenities",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "app_users_email_key",
                table: "app_users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "app_users_role_status_idx",
                table: "app_users",
                columns: new[] { "role", "status" });

            migrationBuilder.CreateIndex(
                name: "app_users_student_code_key",
                table: "app_users",
                column: "student_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "contracts_application_id_key",
                table: "contracts",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "contracts_one_active_per_student",
                table: "contracts",
                column: "student_id",
                unique: true,
                filter: "(status = 'active'::text)");

            migrationBuilder.CreateIndex(
                name: "contracts_student_status_idx",
                table: "contracts",
                columns: new[] { "student_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_contracts_room_id",
                table: "contracts",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "dorm_applications_one_pending_per_student",
                table: "dorm_applications",
                column: "student_id",
                unique: true,
                filter: "(status = 'pending'::text)");

            migrationBuilder.CreateIndex(
                name: "dorm_applications_status_submitted_idx",
                table: "dorm_applications",
                columns: new[] { "status", "submitted_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "dorm_applications_student_idx",
                table: "dorm_applications",
                columns: new[] { "student_id", "submitted_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_dorm_applications_reviewed_by_user_id",
                table: "dorm_applications",
                column: "reviewed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_dorm_applications_room_id",
                table: "dorm_applications",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "invoices_contract_idx",
                table: "invoices",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "invoices_invoice_code_key",
                table: "invoices",
                column: "invoice_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "invoices_payment_code_key",
                table: "invoices",
                column: "payment_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "invoices_student_status_idx",
                table: "invoices",
                columns: new[] { "student_id", "status", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_attachments_AppUserId",
                table: "maintenance_attachments",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_attachments_uploaded_by_user_id",
                table: "maintenance_attachments",
                column: "uploaded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "maintenance_attachments_maintenance_idx",
                table: "maintenance_attachments",
                column: "maintenance_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_histories_actor_user_id",
                table: "maintenance_histories",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_histories_AppUserId",
                table: "maintenance_histories",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "maintenance_histories_maintenance_idx",
                table: "maintenance_histories",
                column: "maintenance_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenances_AppUserId",
                table: "maintenances",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_maintenances_assigned_admin_id",
                table: "maintenances",
                column: "assigned_admin_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenances_RoomId1",
                table: "maintenances",
                column: "RoomId1");

            migrationBuilder.CreateIndex(
                name: "maintenances_room_idx",
                table: "maintenances",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "maintenances_status_idx",
                table: "maintenances",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "maintenances_student_idx",
                table: "maintenances",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_confirmed_by_user_id",
                table: "payments",
                column: "confirmed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_student_id",
                table: "payments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "payments_invoice_status_idx",
                table: "payments",
                columns: new[] { "invoice_id", "status" });

            migrationBuilder.CreateIndex(
                name: "payments_provider_transaction_id_key",
                table: "payments",
                column: "provider_transaction_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_room_type_amenities_amenity_id",
                schema: "public",
                table: "room_type_amenities",
                column: "amenity_id");

            migrationBuilder.CreateIndex(
                name: "rooms_building_room_unique",
                table: "rooms",
                columns: new[] { "building_name", "room_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "rooms_status_capacity_idx",
                table: "rooms",
                columns: new[] { "status", "current_occupancy", "capacity" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "maintenance_attachments");

            migrationBuilder.DropTable(
                name: "maintenance_histories");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "room_type_amenities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "maintenances");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "amenities");

            migrationBuilder.DropTable(
                name: "contracts");

            migrationBuilder.DropTable(
                name: "dorm_applications");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "rooms");
        }
    }
}

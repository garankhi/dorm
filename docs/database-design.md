# SDMS MVP Database Design

## Định hướng

Database dùng Supabase PostgreSQL, nhưng ứng dụng không dùng frontend Supabase client để thao tác dữ liệu. Backend .NET 8 Web API kết nối tới Supabase PostgreSQL bằng Entity Framework Core.

```text
Frontend -> .NET 8 Web API -> EF Core/Npgsql -> Supabase PostgreSQL
```

Vì dự án cần nộp trong 3-4 tuần, schema chỉ phục vụ flow chính:

```text
Đăng ký KTX -> Duyệt đơn -> Tạo hợp đồng -> Hóa đơn
```

## Công nghệ DB/backend đề xuất

| Thành phần | Dùng gì | Ghi chú |
|---|---|---|
| Database host | Supabase PostgreSQL | Lấy connection string từ Supabase Project Settings. |
| ORM | Entity Framework Core | Dùng package `Npgsql.EntityFrameworkCore.PostgreSQL`. |
| Auth | .NET Web API + JWT | User nằm trong bảng `app_users`, password lưu dạng hash. |
| Authorization | Backend role check | Role lấy từ `app_users.role`, không dựa vào frontend. |
| RLS | Không cần trong MVP | Vì frontend không gọi Supabase trực tiếp. Có thể siết sau nếu cần. |

## Bảng chính

| Bảng | Vai trò |
|---|---|
| `app_users` | Tài khoản đăng nhập, role `admin/student`, hồ sơ cơ bản. |
| `rooms` | Phòng KTX, sức chứa, giá, trạng thái. |
| `dorm_applications` | Đơn đăng ký KTX của sinh viên. |
| `contracts` | Hợp đồng được tạo sau khi đơn được duyệt. |
| `invoices` | Hóa đơn tiền phòng. |
| `payments` | Thanh toán đơn giản để Admin đánh dấu hóa đơn đã trả. |

## Lý do không dùng `auth.users` của Supabase

Nếu frontend không gọi Supabase trực tiếp, dùng Supabase Auth sẽ làm team phải xử lý thêm nhiều lớp không cần thiết. Với MVP này, Supabase chỉ đóng vai trò database host. Backend .NET tự quản lý đăng nhập bằng bảng `app_users`, hash password, phát JWT và kiểm tra role.

Cách này hợp hơn với yêu cầu SRS ban đầu là `.NET 8 Web API + Entity Framework Core`, đồng thời vẫn dùng được Supabase làm database online để cả nhóm cùng phát triển.

## Auth và role

Bảng `app_users` chứa:

| Cột | Ghi chú |
|---|---|
| `id` | UUID primary key. |
| `email` | Unique, dùng để đăng nhập. |
| `password_hash` | Hash bằng BCrypt hoặc ASP.NET password hasher. |
| `full_name` | Họ tên. |
| `phone_number` | Số điện thoại, nullable. |
| `role` | `admin` hoặc `student`. |
| `status` | `active`, `locked`, `inactive`. |
| `student_code` | Mã sinh viên, nullable cho admin. |
| `faculty`, `class_name`, `address` | Hồ sơ sinh viên cơ bản. |

Frontend không tự quyết định quyền. Sau khi login, backend trả JWT và thông tin user gồm `id`, `email`, `fullName`, `role`. Các API Admin phải check role admin ở backend.

## Transaction nghiệp vụ trong EF Core

Không dùng Supabase RPC cho MVP EF. Function duyệt đơn nên nằm trong service backend, ví dụ `DormApplicationService.ApproveAsync(...)`.

Khi Admin duyệt đơn, service backend chạy trong một transaction:

1. Load đơn đăng ký theo id, kiểm tra còn `pending`.
2. Load phòng với concurrency/transaction lock hợp lý.
3. Kiểm tra phòng còn chỗ và không `maintenance/inactive`.
4. Cập nhật đơn thành `approved`.
5. Tạo `contracts`.
6. Tăng `rooms.current_occupancy`.
7. Nếu phòng đầy thì đổi `rooms.status` thành `full`.
8. Tạo hóa đơn đầu tiên trong `invoices`.
9. Commit transaction.

Nếu bất kỳ bước nào lỗi thì rollback toàn bộ.

## Constraint quan trọng

| Rule | Cách enforce |
|---|---|
| Mỗi sinh viên chỉ có 1 đơn `pending` | Partial unique index trên `dorm_applications(student_id)` khi `status = 'pending'`. |
| Mỗi sinh viên chỉ có 1 hợp đồng `active` | Partial unique index trên `contracts(student_id)` khi `status = 'active'`. |
| Phòng không vượt sức chứa | Check constraint `current_occupancy <= capacity`. |
| Không trùng phòng trong cùng tòa | Unique `(building_name, room_number)`. |
| Invoice code không trùng | Unique `invoice_code`. |
| Email không trùng | Unique `app_users.email`. |

## API nên dùng cho frontend

Frontend chỉ gọi API backend, không gọi Supabase:

| Flow | API đề xuất |
|---|---|
| Login | `POST /api/auth/login` |
| Register Student | `POST /api/auth/register-student` |
| Current User | `GET /api/auth/me` |
| Student xem phòng | `GET /api/student/rooms` |
| Student đăng ký KTX | `POST /api/student/dorm-applications` |
| Student xem đơn | `GET /api/student/dorm-applications/my` |
| Student xem hợp đồng | `GET /api/student/contracts/my` |
| Student xem hóa đơn | `GET /api/student/invoices/my` |
| Admin quản lý phòng | `GET/POST/PUT /api/admin/rooms` |
| Admin xem đơn | `GET /api/admin/dorm-applications?status=pending` |
| Admin duyệt đơn | `POST /api/admin/dorm-applications/{id}/approve` |
| Admin từ chối đơn | `POST /api/admin/dorm-applications/{id}/reject` |
| Admin xem hóa đơn | `GET /api/admin/invoices` |
| Admin xác nhận paid | `POST /api/admin/invoices/{id}/mark-paid` |

## Gợi ý nâng cấp sau MVP

Khi flow chính ổn, có thể thêm theo thứ tự:

1. Refresh token và đổi mật khẩu.
2. Upload minh chứng thanh toán.
3. Tự động tạo hóa đơn theo tháng.
4. Yêu cầu sửa chữa.
5. Yêu cầu chuyển phòng.
6. Quản lý giường.
7. Dashboard Admin.
8. Siết Supabase RLS nếu sau này có client hoặc service khác truy cập DB trực tiếp.

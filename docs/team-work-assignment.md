# SDMS MVP Team Work Assignment

## Nguyên tắc chia việc

Team ít giao tiếp nên chia theo flow, không chia theo kiểu ai cũng đụng mọi nơi. Mỗi nhóm có phạm vi rõ, output rõ, và chỉ cần bàn giao qua checklist.

Kiến trúc chung:

```text
Frontend -> .NET 8 Web API -> EF Core -> Supabase PostgreSQL
```

Frontend không dùng Supabase client để đọc/ghi database. Mọi màn hình gọi REST API của backend.

Flow chung:

```text
/login -> Student Portal hoặc Admin Portal
Auth & Profile -> Registration & Room Management -> Contract & Billing
```

Nên tách UI thành hai portal riêng:

| Portal | Route đề xuất | Layout/menu |
|---|---|---|
| Student Portal | `/student/*` | Hồ sơ, xem phòng, đăng ký KTX, hợp đồng, hóa đơn. |
| Admin Portal | `/admin/*` | Quản lý phòng, duyệt đơn, hợp đồng/hóa đơn. |

Sau khi login, frontend đọc `role` từ response/JWT để redirect đúng portal. Backend vẫn phải check role ở API; frontend guard chỉ để UX/demo gọn hơn.

## Bảng phân công chính

| Nhóm | Số người | Phụ trách | Công việc cụ thể | Output cần hoàn thành |
|---|---:|---|---|---|
| Nhóm 1 | 2 | Auth, API Base & Student Profile | Làm cổng `/login`, API đăng nhập/đăng ký, JWT, hồ sơ cá nhân, route guard và redirect sang `/admin` hoặc `/student`. Đây là nền tảng của cả hệ thống. | User đăng nhập được qua API, biết role admin/student, vào đúng portal, Student xem/sửa hồ sơ cơ bản được. |
| Nhóm 2 | 2 | Registration & Room Management | Làm luồng đăng ký KTX, quản lý phòng, xem phòng còn chỗ, Admin duyệt/từ chối đơn qua API. Đây là luồng logic cốt lõi. | Student gửi đơn được, Admin xem đơn pending, duyệt/từ chối được. |
| Nhóm 3 | 1 | EF Core, Contract & Billing Lead | Quản lý schema/EF migration, transaction duyệt đơn, tạo hợp đồng, hóa đơn, thanh toán đơn giản. Đây là phần logic khó nhất nên cần nắm toàn bộ flow để hỗ trợ 2 nhóm kia. | Sau khi duyệt đơn có contract + invoice, Student xem được, Admin đánh dấu paid được. |

## Chi tiết từng nhóm

### Nhóm 1: Auth, API Base & Student Profile

Phạm vi:

- Setup cấu trúc .NET Web API cơ bản nếu team chưa có.
- Setup EF Core connection tới Supabase PostgreSQL cùng Nhóm 3.
- Làm `POST /api/auth/register-student`.
- Làm `POST /api/auth/login` trả JWT và thông tin user.
- Làm `GET /api/auth/me`.
- Làm API xem/cập nhật hồ sơ cá nhân.
- Làm frontend `/login` gọi backend API.
- Lưu JWT ở frontend theo cách đơn giản cho MVP.
- Redirect sau login: admin sang `/admin`, student sang `/student`.
- Chặn Student vào route `/admin/*` và chặn Admin vào route `/student/*` nếu team muốn demo gọn.

Không phụ trách:

- Không tự sửa schema database nếu không báo Nhóm 3.
- Không làm màn duyệt đơn.
- Không làm hóa đơn/hợp đồng.
- Không dùng Supabase client ở frontend để query bảng.

Điểm bàn giao:

- Có API auth chạy được.
- Có function/hook frontend lấy current user từ JWT hoặc `/api/auth/me`.
- Các nhóm khác gọi được thông tin `user.id` và `user.role`.
- Có route `/login`, `/admin`, `/student` hoạt động.
- Có tài khoản demo admin/student.

### Nhóm 2: Registration & Room Management

Phạm vi:

- API Student xem danh sách phòng còn chỗ.
- API Student tạo đơn đăng ký KTX.
- API Student xem trạng thái đơn.
- API Admin quản lý phòng cơ bản.
- API Admin xem đơn pending.
- API Admin duyệt/từ chối đơn.
- Frontend tương ứng cho Student room/application và Admin room/application.

Không phụ trách:

- Không tự tạo contract bằng frontend.
- Không tự tạo invoice bằng frontend.
- Không xử lý thanh toán.
- Không gọi Supabase trực tiếp từ frontend.

Điểm bàn giao:

- Khi Admin bấm duyệt, frontend gọi `POST /api/admin/dorm-applications/{id}/approve`.
- Khi Admin bấm từ chối, frontend gọi `POST /api/admin/dorm-applications/{id}/reject`.
- Sau khi duyệt, refresh danh sách đơn và chuyển trạng thái thành approved.

### Nhóm 3: EF Core, Contract & Billing Lead

Phạm vi:

- Quản lý schema Supabase PostgreSQL và EF Core migrations.
- Tạo entity/config cho `app_users`, `rooms`, `dorm_applications`, `contracts`, `invoices`, `payments`.
- Làm transaction duyệt đơn trong backend service.
- API Student xem hợp đồng.
- API Student xem hóa đơn.
- API Admin xem hóa đơn.
- API Admin đánh dấu hóa đơn đã thanh toán.
- Hỗ trợ Nhóm 1 và Nhóm 2 khi vướng database/EF.

Không phụ trách:

- Không ôm toàn bộ frontend.
- Không làm thêm module ngoài MVP nếu flow chính chưa chạy.

Điểm bàn giao:

- Duyệt đơn tạo contract + invoice đúng trong một EF transaction.
- Invoice đổi được sang `paid`.
- Có dữ liệu mẫu để cả team test.

## Ranh giới để tránh conflict

| Khu vực | Người/nhóm được sửa chính | Ghi chú |
|---|---|---|
| Supabase schema / EF migrations | Nhóm 3 | Nhóm khác muốn đổi cột phải báo Nhóm 3. |
| Auth API, JWT, login portal, router | Nhóm 1 | Nhóm khác dùng lại API/hook/component có sẵn. |
| Student registration pages/API | Nhóm 2 | Nhóm 1 chỉ hỗ trợ auth/profile. |
| Admin room/application pages/API | Nhóm 2 | Nhóm 3 hỗ trợ service transaction/schema. |
| Contract/invoice pages/API | Nhóm 3 | Nhóm 2 chỉ cần gọi approve API. |
| Docs/test/demo script | Người rảnh nhất hoặc cả nhóm chia nhỏ | Ưu tiên hoàn thành trước tuần cuối. |

## Checklist giao tiếp hằng ngày

Mỗi người chỉ cần update 3 dòng:

```text
Done: Hôm qua/hiện tại đã xong gì?
Doing: Hôm nay đang làm gì?
Blocked: Đang kẹt gì, cần ai hỗ trợ?
```

Ví dụ:

```text
Done: Đã làm API danh sách phòng.
Doing: Đang làm form tạo đơn đăng ký.
Blocked: Chưa biết lấy user id từ JWT ở backend, cần Nhóm 1 hỗ trợ.
```

## Timeline 4 tuần

| Tuần | Mục tiêu | Kết quả cần có |
|---|---|---|
| Tuần 1 | Setup nền | Supabase DB chạy, .NET API chạy, EF kết nối DB, auth/profile xong cơ bản, có data phòng mẫu. |
| Tuần 2 | Student flow | Student xem phòng, gửi đơn, xem trạng thái đơn qua API. |
| Tuần 3 | Admin approval flow | Admin quản lý phòng, xem đơn, duyệt/từ chối đơn, contract + invoice tự sinh. |
| Tuần 4 | Polish + tài liệu + demo | Sửa lỗi, chuẩn bị slide, SRS scope, test case, demo script, data mẫu. |

## Demo script khuyến nghị

1. Vào `/login` bằng tài khoản Student.
2. Frontend gọi `POST /api/auth/login`.
3. App chuyển sang `/student`.
4. Student xem hồ sơ.
5. Student xem danh sách phòng còn chỗ.
6. Student gửi đơn đăng ký KTX.
7. Logout.
8. Vào `/login` bằng tài khoản Admin.
9. Frontend gọi `POST /api/auth/login`.
10. App chuyển sang `/admin`.
11. Admin xem đơn pending.
12. Admin duyệt đơn.
13. Backend tạo contract + invoice bằng EF transaction.
14. Admin xem invoice vừa tạo.
15. Logout.
16. Login lại Student.
17. Student xem hợp đồng và hóa đơn.
18. Admin đánh dấu hóa đơn paid nếu cần demo thêm.

## Quy tắc chống trễ scope

- Nếu flow chính chưa chạy, không làm sửa chữa/chuyển phòng/dashboard.
- Nếu một chức năng mất hơn 1 ngày chưa xong, giảm độ phức tạp UI trước.
- Nếu bị lỗi auth phức tạp, ưu tiên JWT đơn giản đủ demo thay vì làm refresh token ngay.
- Nếu thiếu thời gian, bỏ `payments` UI và chỉ đổi trực tiếp `invoices.status` sang `paid` qua API.
- Tuần cuối không thêm tính năng mới, chỉ sửa lỗi và luyện demo.

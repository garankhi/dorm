# SDMS MVP Scope

## Mục tiêu

Dự án tập trung vào một flow chính có thể demo rõ trong 3-4 tuần:

```text
Sinh viên đăng ký KTX -> Admin duyệt đơn -> Tạo hợp đồng -> Tạo hóa đơn
```

Mục tiêu không phải là làm đầy đủ toàn bộ SRS ngay từ đầu. Mục tiêu là có một sản phẩm nhỏ nhưng chạy chắc, có phân quyền cơ bản, có dữ liệu thật trong Supabase PostgreSQL, và có demo nghiệp vụ xuyên suốt.

## Kiến trúc MVP

Dự án dùng Supabase như PostgreSQL database host, không dùng frontend gọi Supabase trực tiếp.

```text
Frontend -> .NET 8 Web API -> Entity Framework Core -> Supabase PostgreSQL
```

Frontend chỉ gọi REST API của backend. Backend chịu trách nhiệm đăng nhập, phân quyền, validate dữ liệu, transaction duyệt đơn, tạo hợp đồng và hóa đơn.

## Portal và phân quyền UI

Hệ thống có một cổng đăng nhập chung, sau đó tách thành hai khu vực riêng:

```text
/login -> gọi API /api/auth/login -> đọc role từ JWT/user response -> /admin hoặc /student
```

Không cần tạo hai hệ thống đăng nhập khác nhau. Admin và Student đều đăng nhập qua backend API, nhưng sau khi login thì đi vào layout riêng, menu riêng và route riêng.

| Portal | Route đề xuất | Người dùng | Màn hình chính |
|---|---|---|---|
| Admin Portal | `/admin/*` | Quản trị viên | Dashboard đơn giản, quản lý phòng, duyệt đơn, hóa đơn. |
| Student Portal | `/student/*` | Sinh viên | Hồ sơ, xem phòng, đăng ký KTX, hợp đồng, hóa đơn. |

Vì frontend không gọi database trực tiếp, route guard frontend chỉ để UX/demo gọn. Bảo vệ dữ liệu thật phải nằm ở backend API bằng JWT và role check.

## Module làm trong MVP

| Module | Làm trong MVP | Ghi chú |
|---|---|---|
| Auth | Có | Backend API đăng nhập/đăng ký, phát JWT, role lấy từ `app_users.role`. |
| Student Profile | Có | Sinh viên xem/cập nhật thông tin cá nhân cơ bản qua API. |
| Room Management | Có | Admin tạo/sửa phòng, Student xem phòng còn chỗ. |
| Dorm Registration | Có | Student gửi đơn đăng ký, mỗi sinh viên chỉ có một đơn `pending`. |
| Application Approval | Có | Admin duyệt/từ chối đơn qua API. |
| Contract | Có | Khi duyệt đơn, backend tạo hợp đồng tự động bằng EF transaction. |
| Invoice | Có | Khi duyệt đơn, backend tạo hóa đơn đầu tiên tự động. |
| Payment | Đơn giản | Admin đánh dấu hóa đơn đã thanh toán, chưa cần tích hợp cổng thanh toán. |

## Module để sau

Các phần sau nên đưa vào tài liệu là future enhancement, không làm trong MVP trừ khi còn thời gian:

- Upload minh chứng thanh toán.
- Yêu cầu sửa chữa.
- Yêu cầu chuyển phòng.
- Quản lý giường chi tiết.
- Tự động tạo hóa đơn hàng tháng.
- Gia hạn/chấm dứt hợp đồng phức tạp.
- Dashboard thống kê nâng cao.
- Notification/email.
- Audit log chi tiết.
- Supabase RLS production-grade.

## Flow demo chính

1. User vào `/login`.
2. Frontend gọi `POST /api/auth/login`.
3. Nếu là Student, hệ thống chuyển sang `/student`.
4. Student cập nhật hồ sơ cá nhân qua API.
5. Student xem danh sách phòng còn chỗ qua API.
6. Student gửi đơn đăng ký KTX qua API.
7. Admin vào `/login` và được chuyển sang `/admin`.
8. Admin xem danh sách đơn `pending` qua API.
9. Admin duyệt đơn qua API.
10. Backend dùng EF transaction để tạo hợp đồng và hóa đơn.
11. Student xem trạng thái đơn, hợp đồng và hóa đơn qua API.
12. Admin đánh dấu hóa đơn đã thanh toán qua API.

## Quy tắc nghiệp vụ bắt buộc

- Một sinh viên chỉ có tối đa một đơn đăng ký `pending` tại một thời điểm.
- Một sinh viên chỉ có tối đa một hợp đồng `active` tại một thời điểm.
- Không được duyệt đơn nếu phòng đã đầy, đang bảo trì hoặc inactive.
- Khi duyệt đơn, các thao tác cập nhật đơn, tạo hợp đồng, tăng số người trong phòng và tạo hóa đơn phải chạy cùng một EF transaction.
- Frontend không được dùng Supabase client để đọc/ghi bảng trực tiếp.
- Backend API là nơi kiểm tra Student chỉ được thao tác dữ liệu của chính mình, Admin được xử lý toàn bộ.

## Tiêu chí hoàn thành MVP

- Có schema PostgreSQL chạy được trên Supabase.
- Có EF Core DbContext/entities/migration tương ứng với schema MVP.
- Có ít nhất 1 tài khoản admin và 1 tài khoản student để demo.
- Student tạo đơn đăng ký được qua API.
- Admin duyệt đơn được qua API.
- Sau khi duyệt, contract và invoice được tạo tự động.
- Student xem được contract và invoice của mình.
- Admin đánh dấu invoice paid được.
- Có dữ liệu phòng mẫu để demo nhanh.

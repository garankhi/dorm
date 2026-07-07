# Student Application, Contract, Invoice, Payment Flow

## Muc tieu

Tai lieu nay mo ta flow can hoan thien cho cac chuc nang:

- Theo doi trang thai don: `pending`, `approved`, `rejected`, `cancelled`.
- Admin duyet don va backend tao contract cho thanh toan, tao invoice.
- Student xem hop dong that tu database.
- Student xem hoa don that tu database.
- Thanh toan theo huong MVP: Sepay QR/webhook hien co, hoac upload minh chung va cho admin xac nhan neu muon bam sat SRS.

Kien truc giu nguyen:

```text
React Vite frontend -> .NET Web API -> EF Core -> Supabase PostgreSQL
```

Frontend khong doc/ghi database truc tiep.

## 1. Theo doi trang thai don

### Hien tai

Backend:

- `GET /api/DormApplications/me`: student xem danh sach don cua minh.
- `POST /api/DormApplications`: tao don moi voi `status = "pending"`.
- `DELETE /api/DormApplications/{id}`: dang xoa don khoi database.

Frontend:

- `/student/applications`: goi `GET /api/DormApplications/me`.
- `/student/rooms`: co nut huy don pending.

### Flow dung nen co

```text
Student tao don
-> dorm_applications.status = pending
-> Student xem don trong /student/applications

Student huy don khi status = pending
-> dorm_applications.status = cancelled
-> updated_at = now
-> Don van nam trong lich su

Admin tu choi
-> dorm_applications.status = rejected
-> admin_note = ly do tu choi
-> reviewed_at = now
-> reviewed_by_user_id = admin id

Admin duyet
-> dorm_applications.status = approved
-> tao contract status = pending_payment de giu cho
-> tao invoice status = unpaid
-> chua tang room.current_occupancy
```

### Quy tac dang ky lai

- Neu student co don `pending`: khong duoc tao don moi.
- Neu student co don `approved`, contract `pending_payment`, hoac contract `active`: khong duoc tao don moi.
- Don `cancelled` va `rejected` khong chan dang ky moi.
- Neu student huy don phong A, student duoc dang ky lai phong A neu phong do con cho va status hop le.

### Backend can sua

File:

```text
dorm-api/Controllers/DormApplicationsController.cs
```

Thay `DeleteApplication` tu hard delete sang cancel mem:

```csharp
application.Status = "cancelled";
application.UpdatedAt = DateTime.UtcNow;
await _db.SaveChangesAsync();
return Ok(new { success = true });
```

Khong goi:

```csharp
_db.DormApplications.Remove(application);
```

### Frontend can sua

File:

```text
dorm-web/src/app/pages/student/ApplicationsPage.tsx
dorm-web/src/app/pages/student/RoomsPage.tsx
```

Can them status config cho `cancelled`:

```ts
cancelled: {
  label: "Da huy",
  icon: XCircle,
  className: "bg-slate-50 text-slate-600 border-slate-200",
  dot: "bg-slate-400",
}
```

Trong `RoomsPage`, sau khi huy don khong nen tru `currentOccupancy`, vi tao don pending khong lam tang so nguoi trong phong. So nguoi chi tang khi student thanh toan thanh cong.

## 2. Admin duyet don: tao contract pending_payment va invoice unpaid

### Hien tai

Backend:

- `PATCH /api/applications/{id}/approve` chi doi `application.Status = "approved"`.
- Chua tao `contracts`.
- Chua co co che giu cho `pending_payment`.
- Chua tao `invoices`.

Frontend:

- `/admin/applications` goi API approve/reject that.

### Flow dung nen co

```text
Admin bam Duyet
-> Frontend goi PATCH /api/applications/{id}/approve
-> Backend bat dau transaction
-> Load application + student + room
-> Check application.status == pending
-> Check room.status == available
-> Check room.current_occupancy + so contract pending_payment < room.capacity
-> Check student chua co contract pending_payment hoac active
-> application.status = approved
-> application.reviewed_at = now
-> application.reviewed_by_user_id = admin id
-> Tao contract pending_payment
-> Tao invoice dau ky unpaid
-> Chua tang room.current_occupancy
-> Commit transaction
```

Neu bat ky buoc nao loi thi rollback toan bo.

### Bang du lieu bi anh huong

`dorm_applications`:

```text
status = approved
reviewed_at = now
reviewed_by_user_id = admin id
admin_note = ghi chu neu co
updated_at = now
```

`contracts`:

```text
student_id = application.student_id
room_id = application.room_id
application_id = application.id
start_date = today
end_date = today + 6 hoac 12 thang
monthly_price = room.price_per_month
deposit_amount = 0 hoac theo rule
status = pending_payment
created_at = now
updated_at = now
```

`rooms`: khong doi `current_occupancy` khi approve. Slot duoc giu bang contract `pending_payment`.

`invoices`:

```text
student_id = contract.student_id
contract_id = contract.id
invoice_code = ma hoa don unique
billing_month = thang hien tai
billing_year = nam hien tai
amount = room.price_per_month
due_date = today + 7 ngay
status = unpaid
created_at = now
updated_at = now
```

### Ky thuat code backend

File chinh:

```text
dorm-api/Controllers/ApplicationsController.cs
```

Nen tach logic thanh service neu co thoi gian:

```text
dorm-api/Services/DormApplicationApprovalService.cs
```

Voi MVP, co the viet trong controller truoc cho nhanh.

Dung EF transaction:

```csharp
await using var tx = await _db.Database.BeginTransactionAsync();

// update application, create contract, update room, create invoice

await _db.SaveChangesAsync();
await tx.CommitAsync();
```

Can include room/student:

```csharp
var application = await _db.DormApplications
    .Include(a => a.Room)
    .Include(a => a.Student)
    .FirstOrDefaultAsync(a => a.Id == id);
```

Check active contract:

```csharp
var hasActiveContract = await _db.Contracts.AnyAsync(c =>
    c.StudentId == application.StudentId && c.Status == "active");
```

Tao invoice code:

```text
INV-yyyyMMdd-8 ky tu guid
Vi du: INV-20260705-A1B2C3D4
```

Ly do dung Guid ngan:

- Don gian.
- It bi trung.
- Khong can dem so luong invoice theo ngay.
- Phu hop MVP.

### Frontend sau khi approve

File:

```text
dorm-web/src/app/pages/admin/AdminApplicationsPage.tsx
```

Hien tai chi can reload list sau approve. Neu backend tra ve them contract/invoice thi co the hien toast:

```text
Da duyet don, tao hop dong va hoa don dau ky.
```

## 3. Student xem hop dong hien tai

### Hien tai

Backend:

- Co model `Contract`.
- Co DbSet `Contracts`.
- Chua co API contract.

Frontend:

- `/student/contracts` dang hardcode mock data.

### Flow dung nen co

```text
Student vao /student/contracts
-> FE goi GET /api/contracts/me
-> BE lay current user id tu JWT
-> Query contracts cua student
-> Include room
-> Tra ve danh sach contract
-> FE render contract that
```

### API can them

Controller moi:

```text
dorm-api/Controllers/ContractsController.cs
```

Endpoint:

```text
GET /api/contracts/me
```

Policy:

```text
[Authorize(Policy = "RequireStudent")]
```

Response de FE dung:

```json
[
  {
    "id": "uuid",
    "room": "A - 101",
    "buildingName": "A",
    "roomNumber": "101",
    "startDate": "2026-07-05",
    "endDate": "2027-01-05",
    "monthlyPrice": 750000,
    "depositAmount": 0,
    "status": "active"
  }
]
```

### Frontend can sua

File:

```text
dorm-web/src/app/pages/student/ContractsPage.tsx
```

Bo mang mock:

```ts
const contracts = [...]
```

Them state va fetch API:

```ts
const res = await api.get("/contracts/me");
setContracts(res.data);
```

Render:

- Phong.
- Ngay bat dau.
- Ngay ket thuc.
- Phi phong.
- Trang thai: `active`, `expired`, `terminated`, `pending_payment` neu sau nay co.

## 4. Student xem hoa don

### Hien tai

Backend:

- `GET /api/invoices/me`: lay invoice cua student.
- `GET /api/invoices/{invoiceId}`: xem chi tiet invoice cua student.
- `POST /api/invoices/{invoiceId}/sepay`: tao payment code va QR.

Frontend:

- `/student/invoices` goi API that.
- Co hien QR Sepay.
- Co polling den khi invoice `paid`.

### Flow dung

```text
Admin approve don
-> Backend tao invoice dau ky status = unpaid
-> Student vao /student/invoices
-> FE goi GET /api/invoices/me
-> Student thay hoa don unpaid
-> Student bam Thanh toan
-> FE goi POST /api/invoices/{id}/sepay
-> Backend tao payment_code neu chua co
-> Backend tra qrUrl
-> Student quet QR
-> Sepay goi webhook
-> Backend tao payment va cap nhat invoice.status
```

### Diem con thieu

Invoice chi co y nghia sau khi approve tao invoice. Hien tai approve chua tao invoice nen `/student/invoices` co the rong.

## 5. Thanh toan, upload minh chung, cho admin xac nhan

### Hien tai

He thong dang di theo huong Sepay:

- Student tao QR.
- Sepay webhook xac nhan tien vao.
- Neu dung account va so tien thi invoice thanh `paid`.
- Neu sai account/so tien thi tao payment `pending_confirmation`.

Chua co flow upload minh chung.
Chua co man admin xac nhan payment.

### Hai huong chon

#### Huong A: Giu Sepay cho MVP

Phu hop neu muon demo nhanh va hien dai.

Flow:

```text
Student quet QR
-> Sepay webhook
-> Backend tu xac nhan neu dung so tien/account
-> Invoice paid
```

Can bo sung:

- Admin xem danh sach payment pending_confirmation.
- Admin approve/reject payment neu webhook khong confirm duoc.

API can them:

```text
GET /api/admin/payments?status=pending_confirmation
POST /api/admin/payments/{id}/confirm
POST /api/admin/payments/{id}/reject
```

#### Huong B: Bam sat SRS upload minh chung

Phu hop neu giang vien yeu cau dung "upload minh chung".

Flow:

```text
Student xem invoice unpaid
-> Student upload anh minh chung
-> Backend tao payment status = pending_confirmation
-> Invoice status = pending_confirmation
-> Admin vao trang thanh toan
-> Admin xem minh chung
-> Admin xac nhan
-> Payment status = confirmed
-> Invoice status = paid
```

DB hien co da co cot:

```text
payments.proof_url
payments.status
payments.admin_note
payments.confirmed_at
payments.confirmed_by_user_id
```

Neu chua lam upload file that, MVP co the cho student nhap URL minh chung truoc:

```text
proof_url = link anh Google Drive hoac Supabase Storage URL
```

API can them:

```text
POST /api/invoices/{invoiceId}/payment-proof
GET /api/admin/payments?status=pending_confirmation
POST /api/admin/payments/{paymentId}/confirm
POST /api/admin/payments/{paymentId}/reject
```

## 6. Thu tu implement de it loi

Nen lam theo thu tu nay:

1. Doi cancel don thanh `status = cancelled`, cap nhat FE hien `cancelled`.
2. Sua approve transaction de tao contract `pending_payment`, tao invoice `unpaid`, va giu cho bang reserved count.
3. Them `GET /api/contracts/me`, sua `/student/contracts` dung API that.
4. Kiem tra `/student/invoices` sau approve co hien invoice khong.
5. Chon payment flow:
   - Neu demo nhanh: giu Sepay, them admin payment confirmation sau.
   - Neu bam SRS: them upload proof URL va admin confirm.

## 7. Cach trinh bay voi giang vien

Co the trinh bay nhu sau:

```text
Khi sinh vien dang ky phong, he thong tao mot dorm_application voi trang thai pending.
Trang thai pending khong lam tang current_occupancy, vi sinh vien chua duoc chap nhan vao phong.

Khi sinh vien huy don, he thong khong xoa record ma chuyen sang cancelled de giu lich su.
Cancelled va rejected khong chan sinh vien dang ky lai.

Khi admin duyet don, backend thuc hien trong mot EF transaction:
1. Kiem tra don con pending.
2. Kiem tra phong con cho tinh ca slot dang giu pending_payment va khong bi maintenance/inactive.
3. Doi don sang approved.
4. Tao contract pending_payment de giu cho.
5. Tao invoice dau ky status unpaid.
6. Khi Sepay webhook xac nhan invoice paid, contract moi chuyen active.
7. Luc contract active, he thong tang current_occupancy cua phong va neu day thi doi status phong sang full.

Neu co loi o bat ky buoc nao, transaction rollback, nen khong co tinh trang don approved nhung chua co contract/invoice.
```

## 8. Checklist review sau khi code

- Student dang ky phong xong thay don `pending`.
- Student huy don xong van thay don `cancelled` trong lich su.
- Student co don `cancelled` dang ky lai duoc phong bat ky con cho.
- Admin approve don pending xong:
  - Don thanh `approved`.
  - Bang `contracts` co record moi status `pending_payment`.
  - Bang `rooms.current_occupancy` chua tang.
  - Bang `invoices` co hoa don moi `unpaid`.
- Student vao `/student/contracts` thay contract that.
- Student vao `/student/invoices` thay invoice that.
- Student thanh toan thanh cong:
  - Invoice thanh `paid`.
  - Payment thanh `confirmed`.
  - Contract thanh `active`.
  - Room `current_occupancy` tang 1.

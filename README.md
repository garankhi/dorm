# Dorm Management MVP

Dorm Management MVP la he thong quan ly dang ky ky tuc xa theo flow chinh:

```text
Sinh vien dang ky KTX -> Admin duyet don -> Tao hop dong -> Tao hoa don
```

Kien truc hien tai:

```text
Next.js frontend -> .NET Web API -> EF Core -> Supabase PostgreSQL
```

Frontend khong doc/ghi Supabase truc tiep. Tat ca man hinh frontend goi REST API cua backend.

## Cau truc repo

```text
dorm/
├─ dorm-api/                  # .NET Web API backend
├─ dorm-web/                  # Next.js frontend
├─ supabase/
│  └─ migrations/
│     └─ 001_mvp_schema.sql   # Schema bootstrap cho Supabase PostgreSQL
├─ docs/                      # Tai lieu scope, database, chia viec team
├─ Dorm.slnx                  # Solution .NET
└─ README.md
```

## Yeu cau moi truong

Can cai san:

```text
.NET SDK phu hop voi dorm-api/Dorm.Api.csproj
Node.js + npm
Supabase project
Git
```

Kiem tra nhanh:

```powershell
dotnet --version
node --version
npm --version
```

## Supabase migrations

Tat ca thay doi database nhu them cot, them bang, doi enum, them index, constraint, hoac backfill du lieu phai di qua file migration trong `supabase/migrations/`.

Quy tac team:

1. Khong sua migration cu neu file do da tung apply len Supabase remote.
2. Khong chay SQL truc tiep tren Supabase Dashboard tru khi can sua loi khan cap.
3. Luon commit file migration moi len GitHub cung voi code backend/frontend lien quan.
4. Chi mot nguoi hoac CI duoc push migration len cloud tai mot thoi diem.

Tao migration moi tu root repo:

```powershell
cd D:\Project\dorm
supabase migration new add_room_type_gender_and_amenities
```

Lenh tren se tao file dang:

```text
supabase/migrations/<timestamp>_add_room_type_gender_and_amenities.sql
```

Viet SQL vao file moi. Thu tu nen lam trong migration:

1. Tao type, bang, cot moi neu can.
2. Chuan hoa/backfill du lieu cu truoc khi ep enum, `not null`, `check`, foreign key.
3. Them constraint/index sau khi du lieu da hop le.
4. Neu tao bang trong schema `public`, can xem xet RLS/policy va `grant` theo nhu cau truy cap.

Kien truc hien tai la:

```text
Frontend -> .NET Web API -> EF Core -> Supabase PostgreSQL
```

Frontend khong goi Supabase truc tiep, nen khong expose bang ra client neu backend la noi duy nhat truy cap database.

Lan dau day migration len cloud, dang nhap va link repo voi Supabase project cua team:

```powershell
supabase login
supabase link --project-ref epzptadhxfuwtvxxsgaa
```

Truoc khi push len cloud, xem migration history:

```powershell
supabase migration list --linked
```

Cot `Local` la file dang co trong repo. Cot `Remote` la migration da duoc Supabase ghi nhan la da apply tren cloud.

Chay dry-run truoc moi lan push:

```powershell
supabase db push --linked --dry-run
```

Chi push khi dry-run chi hien nhung migration moi can deploy. Vi du:

```text
Would push these migrations:
 • 20260629025112_add_room_type_gender_and_amenities.sql
```

Neu dry-run hien lai `001_mvp_schema.sql` trong khi cloud da co cac bang MVP, dung push ngay vi migration se thu tao lai bang cu va bi loi trung table. Khi schema MVP da tung duoc tao bang SQL thu cong, danh dau baseline `001` la da applied mot lan:

```powershell
supabase migration repair --linked --status applied 001
supabase migration list --linked
supabase db push --linked --dry-run
```

Sau khi dry-run dung, push len cloud:

```powershell
supabase db push --linked
```

Neu muon test local truoc khi day cloud, can Docker Desktop va Supabase local stack:

```powershell
supabase init
supabase start
supabase migration up
supabase migration list --local
```

Local Supabase khong bat buoc neu team dang dev truc tiep voi Supabase cloud, nhung dry-run tren cloud la bat buoc.

## Cau hinh backend

Backend dung file local:

```text
dorm-api/appsettings.Development.json
```

File nay chua secret local va khong nen commit len git.

Team da upload san file cau hinh backend len Drive noi bo. Khi setup may moi:

1. Mo link Drive noi bo cua team.
2. Tai file `appsettings.Development.json` ve may.
3. Copy file vao dung vi tri:

```text
dorm-api/appsettings.Development.json
```

4. Chay backend va test lai:

```powershell
cd D:\Project\dorm\dorm-api
dotnet run
```

Ghi chu:

- Khong commit `dorm-api/appsettings.Development.json` len git.
- File nay chua Supabase connection string va JWT secret dung cho local/team dev.
- Neu file tren Drive bi thay doi, tai lai file moi va replace file local.
- Neu backend bao loi ket noi database, kiem tra lai password/connection string trong file cau hinh noi bo.

## Cau hinh frontend

Frontend dung file local:

```text
dorm-web/.env.local
```

Noi dung local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Neu backend chay port khac, doi URL cho dung port backend dang chay.

Khong dua database password, Supabase connection string, JWT key, hoac secret nao vao `dorm-web/.env.local`.

## Chay backend

Tu root repo:

```powershell
cd D:\Project\dorm\dorm-api
dotnet restore
dotnet build
dotnet run
```

Sau khi chay, xem terminal de biet API dang nghe o URL nao, vi du:

```text
http://localhost:5000
https://localhost:7001
```

Health endpoints:

```text
GET /api/health
GET /api/health/db
```

Dung browser hoac REST client de test:

```text
http://localhost:5000/api/health
http://localhost:5000/api/health/db
```

`/api/health/db` tra ve database connected thi backend da ket noi duoc Supabase qua EF Core.

## Chay frontend

Tu root repo:

```powershell
cd D:\Project\dorm\dorm-web
npm install
npm run dev
```

Frontend mac dinh chay o:

```text
http://localhost:3000
```

Frontend se goi backend qua bien:

```text
NEXT_PUBLIC_API_BASE_URL
```

## API route convention

Backend API dung prefix `/api`:

```text
/api/auth/login
/api/auth/me
/api/student/rooms
/api/admin/rooms
```

Frontend page route khong dung prefix `/api`:

```text
/login
/student
/admin
```

Quy tac nay giup team phan biet ro:

```text
Frontend route = man hinh nguoi dung
Backend route = endpoint du lieu/lenh cho frontend goi
```

## Flow MVP

Flow demo chinh:

1. Student dang nhap o `/login`.
2. Frontend goi `POST /api/auth/login`.
3. Student vao `/student`.
4. Student xem danh sach phong trong.
5. Student gui don dang ky KTX.
6. Admin dang nhap o `/login`.
7. Admin vao `/admin`.
8. Admin xem don pending.
9. Admin duyet don.
10. Backend tao contract va invoice trong mot EF transaction.
11. Student xem hop dong va hoa don.
12. Admin danh dau invoice paid neu can demo them.

## Phan cong team

Theo tai lieu `docs/team-work-assignment.md`:

```text
Nhom 1: Auth, API base, JWT, Student profile, login UI
Nhom 2: Room management, dorm application flow
Nhom 3: EF Core, approval transaction, contract, invoice, payment
```

Thu tu nen lam:

1. Hoan thanh backend foundation: EF Core, CORS, JWT config, controller pipeline, health check.
2. Nhom 1 lam Auth API va login frontend.
3. Nhom 2 lam room va dorm application flow.
4. Nhom 3 lam approve transaction, contract, invoice, mark paid.
5. Ca team chay demo script va chi sua blocker trong tuan cuoi.

## API can thong nhat

Auth:

```text
POST /api/auth/register-student
POST /api/auth/login
GET  /api/auth/me
```

Student:

```text
GET  /api/student/rooms
POST /api/student/dorm-applications
GET  /api/student/dorm-applications/my
GET  /api/student/contracts/my
GET  /api/student/invoices/my
```

Admin:

```text
GET  /api/admin/rooms
POST /api/admin/rooms
PUT  /api/admin/rooms/{id}
GET  /api/admin/dorm-applications?status=pending
POST /api/admin/dorm-applications/{id}/approve
POST /api/admin/dorm-applications/{id}/reject
GET  /api/admin/invoices
POST /api/admin/invoices/{id}/mark-paid
```

## Git workflow de xuat

Khong push thang len `main`.

Nhanh de xuat:

```text
main
dev
feature/auth-api
feature/student-registration
feature/admin-approval-billing
```

Quy tac:

- Moi nhom lam tren branch rieng.
- Pull/update thuong xuyen tu `develop`.
- Tao PR vao `develop` khi xong mot flow nho.
- Khong sua schema database neu chua bao nguoi phu trach EF/schema.
- Khong commit secret: database password, JWT key, `.env.local`, `appsettings.Development.json`.

## Checklist truoc khi bat dau code feature

- Backend build pass:

```powershell
cd D:\Project\dorm\dorm-api
dotnet build
```

- Backend health pass:

```text
GET /api/health
GET /api/health/db
```

- Frontend chay duoc:

```powershell
cd D:\Project\dorm\dorm-web
npm run dev
```

- Supabase da co schema MVP.
- Team da thong nhat API route va branch lam viec.

## Tai lieu lien quan

```text
docs/mvp-scope.md
docs/database-design.md
docs/team-work-assignment.md
docs/superpowers/plans/2026-06-18-sdms-mvp-ef-supabase.md
```

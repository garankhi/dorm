import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type AdminApplication = {
  id: string;
  studentName: string;
  studentCode: string;
  email: string;
  phoneNumber: string;
  room: string;
  building: string;
  submittedAt: string;
  status: ApplicationStatus;
  reason: string;
  adminNote?: string;
};

export const initialApplications: AdminApplication[] = [
  {
    id: "DK-2026-001",
    studentName: "Nguyễn Minh Anh",
    studentCode: "SV001",
    email: "minhanh@student.local",
    phoneNumber: "0901001001",
    room: "101",
    building: "Nhà A",
    submittedAt: "18/06/2026",
    status: "pending",
    reason: "Em muốn ở gần khu giảng đường để tiện đi học buổi sáng.",
  },
  {
    id: "DK-2026-002",
    studentName: "Trần Quốc Bảo",
    studentCode: "SV014",
    email: "quocbao@student.local",
    phoneNumber: "0901001014",
    room: "201",
    building: "Nhà B",
    submittedAt: "19/06/2026",
    status: "pending",
    reason: "Gia đình ở xa, cần đăng ký chỗ ở ổn định trong năm học.",
  },
  {
    id: "DK-2026-003",
    studentName: "Lê Thu Hà",
    studentCode: "SV022",
    email: "thuha@student.local",
    phoneNumber: "0901001022",
    room: "102",
    building: "Nhà A",
    submittedAt: "19/06/2026",
    status: "pending",
    reason: "Muốn ở cùng khu với các bạn cùng lớp để thuận tiện học nhóm.",
  },
  {
    id: "DK-2026-004",
    studentName: "Phạm Gia Huy",
    studentCode: "SV033",
    email: "giahuy@student.local",
    phoneNumber: "0901001033",
    room: "202",
    building: "Nhà B",
    submittedAt: "15/06/2026",
    status: "approved",
    reason: "Sinh viên năm nhất cần hỗ trợ chỗ ở.",
    adminNote: "Đã duyệt, phòng còn đủ chỗ.",
  },
  {
    id: "DK-2026-005",
    studentName: "Đỗ Khánh Linh",
    studentCode: "SV045",
    email: "khanhlinh@student.local",
    phoneNumber: "0901001045",
    room: "305",
    building: "Nhà C",
    submittedAt: "14/06/2026",
    status: "approved",
    reason: "Cần ký túc xá do lịch học thực hành kéo dài buổi tối.",
    adminNote: "Ưu tiên vì lịch học thực hành buổi tối.",
  },
  {
    id: "DK-2026-006",
    studentName: "Vũ Hải Nam",
    studentCode: "SV052",
    email: "hainam@student.local",
    phoneNumber: "0901001052",
    room: "102",
    building: "Nhà A",
    submittedAt: "12/06/2026",
    status: "rejected",
    reason: "Muốn chuyển sang phòng gần cổng phụ.",
    adminNote: "Phòng đã đủ số lượng tại thời điểm xét duyệt.",
  },
  {
    id: "DK-2026-007",
    studentName: "Hoàng Mai Chi",
    studentCode: "SV061",
    email: "maichi@student.local",
    phoneNumber: "0901001061",
    room: "401",
    building: "Nhà D",
    submittedAt: "10/06/2026",
    status: "cancelled",
    reason: "Đăng ký thử trước khi xác nhận lịch học.",
    adminNote: "Sinh viên đã hủy đơn.",
  },
];

export const applicationStatusConfig = {
  pending: {
    label: "Chờ duyệt",
    icon: Clock,
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    className: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-600",
    dot: "bg-red-400",
  },
  cancelled: {
    label: "Đã hủy",
    icon: XCircle,
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
} satisfies Record<ApplicationStatus, { label: string; icon: typeof Clock; className: string; dot: string }>;

export const applicationStatusOptions: Array<{ value: ApplicationStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
];

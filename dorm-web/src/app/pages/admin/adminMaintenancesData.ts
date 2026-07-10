import { CalendarDays, CheckCircle2, File, FileText, ShieldAlert, Wrench } from "lucide-react";

export type MaintenanceStatus =
  | "submitted"
  | "triaged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export type MaintenanceSeverity = "low" | "medium" | "high" | "critical";

export type MaintenanceIssueType =
  | "electricity"
  | "plumbing"
  | "door"
  | "air_conditioning"
  | "cleaning"
  | "other";

export const maintenanceStatusConfig: Record<MaintenanceStatus, { label: string; icon: typeof CalendarDays; className: string; dot: string }> = {
  submitted: {
    label: "Đã gửi",
    icon: CalendarDays,
    className: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  triaged: {
    label: "Đã phân loại",
    icon: CheckCircle2,
    className: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "Đang xử lý",
    icon: Wrench,
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Đã xử lý",
    icon: FileText,
    className: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  closed: {
    label: "Đã đóng",
    icon: ShieldAlert,
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
    dot: "bg-zinc-500",
  },
  rejected: {
    label: "Đã từ chối",
    icon: File,
    className: "border-red-200 bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
};

export const maintenanceStatusOptions: Array<{ value: MaintenanceStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "submitted", label: "Đã gửi" },
  { value: "triaged", label: "Đã phân loại" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "closed", label: "Đã đóng" },
  { value: "rejected", label: "Đã từ chối" },
];

export const maintenanceIssueTypeOptions: Array<{ value: MaintenanceIssueType; label: string }> = [
  { value: "electricity", label: "Điện nước" },
  { value: "plumbing", label: "Ống nước" },
  { value: "door", label: "Cửa/khóa" },
  { value: "air_conditioning", label: "Điều hòa/quạt" },
  { value: "cleaning", label: "Vệ sinh" },
  { value: "other", label: "Khác" },
];

export const maintenanceSeverityOptions: Array<{ value: MaintenanceSeverity; label: string }> = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Nguy cấp" },
];

export function getRoomFloor(roomNumber: string) {
  const match = roomNumber.trim().match(/^\d+/);
  if (!match) return "Khác";
  return match[0][0] ?? "Khác";
}

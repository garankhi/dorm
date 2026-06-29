import { CheckCircle2, CircleOff, Users, Wrench } from "lucide-react";

export type RoomStatus = "available" | "full" | "maintenance" | "inactive";

export type AdminRoom = {
  id: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  roomType: "standard" | "premium";
  capacity: number;
  currentOccupancy: number;
  pricePerMonth: number;
  status: RoomStatus;
  description?: string;
  currentStudents: Array<{
    id: string;
    fullName: string;
    studentCode: string;
  }>;
  pendingApplications: number;
};

export const initialRooms: AdminRoom[] = [
  {
    id: "A-101",
    buildingName: "Nhà A",
    roomNumber: "101",
    floor: 1,
    roomType: "standard",
    capacity: 4,
    currentOccupancy: 2,
    pricePerMonth: 750000,
    status: "available",
    description: "Phòng tiêu chuẩn gần cổng chính, phù hợp sinh viên năm nhất.",
    currentStudents: [
      { id: "SV011", fullName: "Nguyễn Đức An", studentCode: "SV011" },
      { id: "SV012", fullName: "Trần Hoàng Bách", studentCode: "SV012" },
    ],
    pendingApplications: 2,
  },
  {
    id: "A-102",
    buildingName: "Nhà A",
    roomNumber: "102",
    floor: 1,
    roomType: "standard",
    capacity: 4,
    currentOccupancy: 4,
    pricePerMonth: 750000,
    status: "full",
    description: "Phòng tiêu chuẩn đã đủ số lượng sinh viên lưu trú.",
    currentStudents: [
      { id: "SV021", fullName: "Lê Minh Châu", studentCode: "SV021" },
      { id: "SV022", fullName: "Phạm Thu Dung", studentCode: "SV022" },
      { id: "SV023", fullName: "Đỗ Gia Hân", studentCode: "SV023" },
      { id: "SV024", fullName: "Vũ Bảo Ngọc", studentCode: "SV024" },
    ],
    pendingApplications: 1,
  },
  {
    id: "B-201",
    buildingName: "Nhà B",
    roomNumber: "201",
    floor: 2,
    roomType: "premium",
    capacity: 2,
    currentOccupancy: 0,
    pricePerMonth: 1200000,
    status: "available",
    description: "Phòng premium 2 người, có khu sinh hoạt riêng.",
    currentStudents: [],
    pendingApplications: 3,
  },
  {
    id: "B-202",
    buildingName: "Nhà B",
    roomNumber: "202",
    floor: 2,
    roomType: "standard",
    capacity: 4,
    currentOccupancy: 3,
    pricePerMonth: 800000,
    status: "maintenance",
    description: "Đang bảo trì hệ thống điện và quạt trần.",
    currentStudents: [
      { id: "SV031", fullName: "Hoàng Anh Khoa", studentCode: "SV031" },
      { id: "SV032", fullName: "Đặng Minh Long", studentCode: "SV032" },
      { id: "SV033", fullName: "Ngô Hải Nam", studentCode: "SV033" },
    ],
    pendingApplications: 0,
  },
  {
    id: "C-305",
    buildingName: "Nhà C",
    roomNumber: "305",
    floor: 3,
    roomType: "premium",
    capacity: 2,
    currentOccupancy: 2,
    pricePerMonth: 1350000,
    status: "full",
    description: "Phòng premium khu yên tĩnh, ưu tiên sinh viên năm cuối.",
    currentStudents: [
      { id: "SV041", fullName: "Bùi Thanh Tùng", studentCode: "SV041" },
      { id: "SV042", fullName: "Nguyễn Quốc Việt", studentCode: "SV042" },
    ],
    pendingApplications: 1,
  },
  {
    id: "D-401",
    buildingName: "Nhà D",
    roomNumber: "401",
    floor: 4,
    roomType: "standard",
    capacity: 6,
    currentOccupancy: 0,
    pricePerMonth: 650000,
    status: "inactive",
    description: "Phòng đang tạm ngưng sử dụng để rà soát cơ sở vật chất.",
    currentStudents: [],
    pendingApplications: 0,
  },
];

export const roomStatusConfig = {
  available: {
    label: "Còn chỗ",
    icon: CheckCircle2,
    className: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  full: {
    label: "Đã đầy",
    icon: Users,
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-500",
  },
  maintenance: {
    label: "Bảo trì",
    icon: Wrench,
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  inactive: {
    label: "Ngưng dùng",
    icon: CircleOff,
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
} satisfies Record<RoomStatus, { label: string; icon: typeof CheckCircle2; className: string; dot: string }>;

export const roomStatusOptions: Array<{ value: RoomStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "available", label: "Còn chỗ" },
  { value: "full", label: "Đã đầy" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "inactive", label: "Ngưng dùng" },
];

export function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export function roomTypeLabel(type: AdminRoom["roomType"]) {
  return type === "premium" ? "Premium" : "Tiêu chuẩn";
}

export function emptyBeds(room: AdminRoom) {
  return Math.max(room.capacity - room.currentOccupancy, 0);
}

export function nextActiveStatus(room: AdminRoom): RoomStatus {
  return room.currentOccupancy >= room.capacity ? "full" : "available";
}

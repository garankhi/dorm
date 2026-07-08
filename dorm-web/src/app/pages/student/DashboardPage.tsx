import { useNavigate } from "react-router";
import { getCurrentUser } from "../../auth";
import {
  User,
  BedDouble,
  ClipboardList,
  FileText,
  Receipt,
  Wrench,
} from "lucide-react";

const cards = [
  {
    icon: User,
    label: "Hồ sơ",
    desc: "Thông tin cá nhân",
    to: "/student/profile",
    color: "bg-[#eef0ff] text-[#4a5cab]",
    iconColor: "text-[#5b6ef8]",
  },
  {
    icon: BedDouble,
    label: "Lưu trú",
    desc: "Danh sách phòng KTX",
    to: "/student/rooms",
    color: "bg-[#e8f8f0] text-[#2d7d5a]",
    iconColor: "text-[#3aaa78]",
  },
  {
    icon: ClipboardList,
    label: "Đăng ký KTX",
    desc: "Đơn đăng ký của bạn",
    to: "/student/applications",
    color: "bg-[#fff4e6] text-[#96540e]",
    iconColor: "text-[#f59e0b]",
  },
  {
    icon: FileText,
    label: "Hợp đồng",
    desc: "Hợp đồng lưu trú",
    to: "/student/contracts",
    color: "bg-[#fce8f3] text-[#8b2d62]",
    iconColor: "text-[#d946a8]",
  },
  {
    icon: Receipt,
    label: "Hóa đơn",
    desc: "Thanh toán & phí",
    to: "/student/invoices",
    color: "bg-[#e8f3ff] text-[#1d4f8c]",
    iconColor: "text-[#3b82f6]",
  },
  {
    icon: Wrench,
    label: "Báo hư hỏng",
    desc: "Báo cáo sự cố phòng KTX",
    to: "/student/maintenance",
    color: "bg-[#fff0f6] text-[#b92c70]",
    iconColor: "text-[#e93d82]",
  },
];

export default function DashboardPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const firstName = user?.name.split(" ").pop() ?? "Sinh viên";

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-muted-foreground text-sm mb-1">Cổng thông tin sinh viên</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Xin chào, {firstName} 👋
        </h1>
        {user?.studentId && (
          <p className="text-sm text-muted-foreground mt-1">MSSV: {user.studentId}</p>
        )}
      </div>

      {/* Quick stat strip */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Phòng hiện tại", value: "P.204A" },
          { label: "Hóa đơn chưa thanh toán", value: "1" },
          { label: "Đơn đang xử lý", value: "2" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, label, desc, to, color, iconColor, disabled }) => (
          <button
            key={label}
            onClick={() => { if (to) navigate(to); }}
            disabled={disabled}
            className={`group text-left rounded-2xl border border-border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 ${
              disabled ? "" : "cursor-pointer"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
              <Icon size={18} className={iconColor} />
            </div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from "react-router";
import { useState } from "react";
import { getCurrentUser, logout } from "../auth";
import {
  LayoutDashboard,
  User,
  BedDouble,
  ClipboardList,
  FileText,
  Receipt,
  LogOut,
  Menu,
  X,
  Building2,
  ArrowLeft,
  Wrench,
} from "lucide-react";

const navItems = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/profile", label: "Hồ sơ", icon: User, end: false },
  { to: "/student/rooms", label: "Lưu trú", icon: BedDouble, end: false },
  { to: "/student/applications", label: "Đăng ký KTX", icon: ClipboardList, end: false },
  { to: "/student/contracts", label: "Hợp đồng", icon: FileText, end: false },
  { to: "/student/invoices", label: "Hóa đơn", icon: Receipt, end: false },
  { to: "/student/maintenance", label: "Báo hư hỏng", icon: Wrench, end: false },
];

export default function StudentLayout() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDashboard = location.pathname === "/student" || location.pathname === "/student/";

  const initials = user?.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "SV";

  const sidebar = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">Ký Túc Xá</p>
          <p className="text-xs text-muted-foreground">Trường Đại Học</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-full">{sidebar}</div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200 shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border">
          <div className="flex items-center gap-1">
            {/* Nếu KHÔNG PHẢI dashboard, hiển thị nút Quay lại. Nếu LÀ dashboard, hiển thị nút Menu Sidebar */}
            {!isDashboard ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <span className="text-sm font-semibold">Ký Túc Xá</span>
          </div>
          {!isDashboard ? (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu size={18} />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

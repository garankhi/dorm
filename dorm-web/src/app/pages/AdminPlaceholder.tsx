import { logout } from "../auth";
import { useNavigate } from "react-router";

export default function AdminPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Trang Quản Trị</h1>
        <p className="text-muted-foreground mb-6">Portal dành cho admin đang được phát triển.</p>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

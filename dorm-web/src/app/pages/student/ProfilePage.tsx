import { useState } from "react";
import { getCurrentUser, updateCurrentUser } from "../../auth";
import { User as UserIcon, Pencil, Check, X } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(() => getCurrentUser()!);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    studentId: user.studentId,
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || "",
    faculty: user.faculty || "",
    className: user.className || "",
    address: user.address || "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      const updated = await updateCurrentUser(form);
      setUser(updated);
      setForm({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        studentId: updated.studentId,
        gender: updated.gender || "",
        dateOfBirth: updated.dateOfBirth || "",
        faculty: updated.faculty || "",
        className: updated.className || "",
        address: updated.address || "",
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      studentId: user.studentId,
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      faculty: user.faculty || "",
      className: user.className || "",
      address: user.address || "",
    });
    setEditing(false);
    setError("");
  };

  const initials = user.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground mt-1">Xem và cập nhật thông tin của bạn.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-accent/50 px-6 py-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">MSSV: {user.studentId || "Chưa cập nhật"}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
              <UserIcon size={10} /> Sinh viên
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Họ và tên", key: "name", type: "text", placeholder: "Nguyễn Văn A", fullWidth: true },
            { label: "Email", key: "email", type: "email", placeholder: "email@example.com", disabled: true, fullWidth: true },
            { label: "Số điện thoại", key: "phone", type: "tel", placeholder: "0912 345 678" },
            { label: "MSSV", key: "studentId", type: "text", placeholder: "Mã số sinh viên", disabled: true },
            { label: "Giới tính", key: "gender", type: "text", placeholder: "Nam / Nữ / Khác" },
            { label: "Ngày sinh", key: "dateOfBirth", type: "date", placeholder: "yyyy-mm-dd" },
            { label: "Khoa/Ngành", key: "faculty", type: "text", placeholder: "Công nghệ thông tin" },
            { label: "Lớp học", key: "className", type: "text", placeholder: "IT01" },
            { label: "Địa chỉ", key: "address", type: "text", placeholder: "Hà Nội", fullWidth: true },
          ].map(({ label, key, type, placeholder, disabled, fullWidth }) => (
            <div key={key} className={fullWidth ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                {label}
              </label>
              {editing ? (
                <input
                  type={type}
                  value={form[key as keyof typeof form] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  disabled={disabled || loading}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
              ) : (
                <p className="text-sm text-foreground py-2">
                  {form[key as keyof typeof form] || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Check size={14} /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              >
                <X size={14} /> Hủy
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Pencil size={14} /> Chỉnh sửa
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <Check size={14} /> Đã lưu
            </span>
          )}
          {error && (
            <span className="text-sm text-destructive font-medium">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

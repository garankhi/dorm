import { BedDouble, Users, Search } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { useEffect, useState } from "react";
import api from "../../api/dorm";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface Room {
  id: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  currentOccupancy: number;
  available: number;
  pricePerMonth: number;
  status: string;
  description?: string;
  roomGender: string;
}

interface ApplicationSummary {
  id: string;
  roomId: string;
  room: string;
  status: string;
  submittedAt: string;
  note?: string;
}

function roomTypeLabel(type: string, capacity: number) {
  const labels: Record<string, string> = {
    room_2: "Phòng 2 người",
    room_4: "Phòng 4 người",
    room_6: "Phòng 6 người",
    room_8: "Phòng 8 người",
    standard: `Phòng ${capacity} người`,
    premium: `Phòng ${capacity} người`,
    deluxe: `Phòng ${capacity} người`,
  };

  return labels[type] ?? `Phòng ${capacity} người`;
}

export default function RoomsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<ApplicationSummary | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [registerRoomId, setRegisterRoomId] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Không thể tải danh sách phòng", err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get("/DormApplications/me");
      const mapped: ApplicationSummary[] = res.data.map((x: any) => ({
        id: x.id,
        roomId: x.roomId,
        room: `${x.buildingName} - ${x.roomNumber}`,
        status: x.status,
        submittedAt: x.submittedAt,
        note: x.reason,
      }));
      const active = mapped.find((x) => x.status === "pending" || x.status === "approved");
      setActiveApp(active || null);
    } catch (err) {
      console.error("Không thể tải đơn đăng ký", err);
    }
  };

  useEffect(() => {
    loadRooms();
    loadApplications();
  }, []);

  const filtered = rooms.filter((r) => {
    const searchText = search.toLowerCase();
    const matchSearch =
      r.roomNumber.toLowerCase().includes(searchText) ||
      r.buildingName.toLowerCase().includes(searchText);
    const matchFilter = statusFilter === "all" || r.available > 0;
    const matchGender = genderFilter === "all" || r.roomGender.toLowerCase() === genderFilter;

    return matchSearch && matchFilter && matchGender;
  });

  const registerRoom = async (roomId: string) => {
    try {
      if (activeApp && activeApp.roomId !== roomId) {
        toast.error("Bạn đang có đơn đăng ký phòng khác. Vui lòng hủy đơn trước.");
        return;
      }

      await api.post("/DormApplications", { roomId });
      await loadApplications();
      await loadRooms();

      toast.success("Đăng ký phòng thành công!");
    } catch (err: any) {
      if (err.response?.data?.error === "profile_incomplete") {
        toast.error(err.response.data.message, {
          action: {
            label: "Cập nhật ngay",
            onClick: () => navigate("/student/profile"),
          },
          duration: 5000,
        });
      } else {
        toast.error(err.response?.data?.error ?? "Đăng ký thất bại");
      }
    }
  };

  const cancelApplication = async (id: string) => {
    try {
      await api.delete(`/DormApplications/${id}`);
      await loadApplications();
      await loadRooms();
      toast.success("Đã hủy đơn đăng ký");
    } catch {
      toast.error("Hủy đơn thất bại");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Danh sách phòng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xem thông tin và đăng ký phòng ký túc xá hành trình mới.
        </p>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm phòng hoặc tòa nhà..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex gap-3 shrink-0">
          {/* Lọc Trạng Thái */}
          <div className="flex rounded-xl border border-border bg-white p-1 text-sm shadow-sm">
            {(["all", "available"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 font-medium rounded-lg transition-all ${
                  statusFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Tất cả" : "Còn chỗ"}
              </button>
            ))}
          </div>

          {/* Lọc Giới Tính */}
          <div className="flex rounded-xl border border-border bg-white p-1 text-sm shadow-sm">
            {(["all", "male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-4 py-1.5 font-medium rounded-lg transition-all ${
                  genderFilter === g
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "all" ? "Tất cả" : g === "male" ? "Nam" : "Nữ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid danh sách phòng */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((room) => {
            const isMyRoom = activeApp?.roomId === room.id;
            const hasActiveApplication = !!activeApp;
            const isApplied = hasActiveApplication && !isMyRoom;
            const full = room.available === 0;

            return (
              <div
                key={room.id}
                onClick={() => navigate(`/student/rooms/${room.id}`)}
                className="p-5 group cursor-pointer bg-white rounded-2xl border border-border hover:border-primary hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[250px]"
              >
                <div className="space-y-4">
                  {/* Header Card */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <BedDouble size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                          Phòng {room.roomNumber}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {room.buildingName} • Tầng {room.floor}
                        </p>
                      </div>
                    </div>
                    <Badge variant={room.roomGender.toLowerCase() === "male" ? "default" : "secondary"}>
                      {room.roomGender.toLowerCase() === "male" ? "Nam" : "Nữ"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      {roomTypeLabel(room.roomType, room.capacity)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        full ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                      }`}
                    >
                      {full ? "Hết chỗ" : `Còn ${room.available} chỗ`}
                    </span>
                  </div>

                  {/* Thanh Tiến Độ Chỗ Ở */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> Đang ở
                      </span>
                      <span className="font-medium text-foreground">
                        {room.currentOccupancy}/{room.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${(room.currentOccupancy / room.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {room.pricePerMonth.toLocaleString("vi-VN")}₫
                    </p>
                    <p className="text-[10px] text-muted-foreground">/ tháng</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isMyRoom ? (
                      <div className="flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-xl border border-green-100">
                        <span className="text-green-600 text-xs font-semibold">
                          {activeApp.status === "approved" ? "Chờ thanh toán" : "Đang chọn"}
                        </span>
                        {activeApp.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelId(activeApp.id);
                            }}
                            className="text-xs px-2 py-1 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    ) : isApplied ? (
                      <span className="text-muted-foreground text-xs bg-slate-50 px-2 py-1 rounded border">
                        Đang chờ duyệt phòng khác
                      </span>
                    ) : (
                      <button
                        disabled={full}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegisterRoomId(room.id);
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none transition"
                      >
                        {full ? "Hết chỗ" : "Đăng ký"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trống kết quả */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 border border-dashed rounded-2xl bg-white">
          <BedDouble size={40} className="mx-auto mb-3 opacity-20 text-primary" />
          <p className="text-sm text-muted-foreground">Không tìm thấy phòng phù hợp với bộ lọc hiện tại.</p>
        </div>
      )}

      {/* Dialog Xác Nhận Đăng Ký */}
      <AlertDialog open={!!registerRoomId} onOpenChange={(open) => !open && setRegisterRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng ký phòng</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống sẽ gửi đơn đăng ký xét duyệt của bạn đến Ban quản lý ký túc xá. Bạn có chắc chắn muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (registerRoomId) {
                  registerRoom(registerRoomId);
                  setRegisterRoomId(null);
                }
              }}
            >
              Đăng ký ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Xác Nhận Hủy Đơn */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn đăng ký phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bạn sẽ phải thực hiện gửi lại đơn đăng ký xếp phòng từ đầu nếu thay đổi ý định.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không, quay lại</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (cancelId) {
                  cancelApplication(cancelId);
                  setCancelId(null);
                }
              }}
            >
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { BedDouble, Users, CheckCircle2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/dorm";
import { toast } from "sonner";

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

export default function RoomsPage() {
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
  }

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [applied, setApplied] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<any | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [registerRoomId, setRegisterRoomId] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      const res = await api.get("/DormApplications/rooms");
      setRooms(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    const res = await api.get("/DormApplications/me");

    const mapped = res.data.map((x: any) => ({
      id: x.id,
      roomId: x.roomId,
      room: `${x.buildingName} - ${x.roomNumber}`,
      status: x.status,
      submittedAt: x.submittedAt,
      note: x.reason,
    }));

    setApplications(mapped);

    const active = mapped.find((x: any) => x.status === "pending");

    setActiveApp(active || null);
  };

  useEffect(() => {
    loadRooms();
    loadApplications();
  }, []);

  const appliedRoomIds = new Set(applications.map((a: any) => a.roomId));

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.buildingName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.available > 0;
    return matchSearch && matchFilter;
  });

  const registerRoom = async (roomId: string) => {
    try {
      if (activeApp && activeApp.roomId !== roomId) {
        toast.error(
          "Bạn đang có đơn đăng ký phòng khác. Vui lòng hủy đơn trước.",
        );
        return;
      }

      await api.post("/DormApplications", {
        roomId,
      });

      // cập nhật UI ngay
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                currentOccupancy: r.currentOccupancy + 1,
                available: Math.max(0, r.available - 1),
              }
            : r,
        ),
      );

      await loadApplications();

      toast.success("Đăng ký phòng thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Đăng ký thất bại");
    }
  };

  const cancelApplication = async (id: string) => {
    try {
      const roomId = activeApp?.roomId;

      await api.delete(`/DormApplications/${id}`);

      if (roomId) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  currentOccupancy: Math.max(0, r.currentOccupancy - 1),
                  available: r.available + 1,
                }
              : r,
          ),
        );
      }

      await loadApplications();

      toast.success("Đã hủy đơn đăng ký");
    } catch {
      toast.error("Hủy đơn thất bại");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Danh sách phòng
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xem thông tin và đăng ký phòng ký túc xá.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm phòng hoặc tòa nhà..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-white overflow-hidden text-sm">
          {(["all", "available"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "Tất cả" : "Còn chỗ"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((room) => {
          const isMyRoom = activeApp?.roomId === room.id;
          const hasActiveApplication = !!activeApp;
          const isApplied = applications.some((a) => a.roomId === room.id);
          const full = room.available === 0;
          return (
            <div
              key={room.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-sm ${
                full ? "border-border opacity-70" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e8ebff] flex items-center justify-center">
                      <BedDouble size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {room.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {room.buildingName} · {room.floor}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    room.roomType === "Nam"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-pink-50 text-pink-600"
                  }`}
                >
                  {room.roomType}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  Sức chứa: {room.capacity} người
                </span>
                <span
                  className={`font-medium ${full ? "text-red-500" : "text-green-600"}`}
                >
                  {full ? "Hết chỗ" : `Còn ${room.available} chỗ trống`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <p className="text-sm font-semibold text-foreground">
                  {room.pricePerMonth.toLocaleString("vi-VN")}₫
                  <span className="text-xs font-normal text-muted-foreground">
                    /tháng
                  </span>
                </p>
                {isMyRoom ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xs font-medium">
                      Đang đăng ký
                    </span>

                    <button
                      onClick={() => setCancelId(activeApp.id)}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:opacity-90"
                    >
                      Hủy
                    </button>
                  </div>
                ) : isApplied ? (
                  <span className="text-gray-500 text-xs">
                    Đã đăng ký phòng khác
                  </span>
                ) : (
                  <button
                    disabled={full && !hasActiveApplication}
                    onClick={() => setRegisterRoomId(room.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg disabled:opacity-40"
                  >
                    {full ? "Hết chỗ" : "Đăng ký"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BedDouble size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không tìm thấy phòng phù hợp.</p>
        </div>
      )}

      <AlertDialog
        open={!!registerRoomId}
        onOpenChange={() => setRegisterRoomId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng ký</AlertDialogTitle>

            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng ký phòng này không?
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
              Đăng ký
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn đăng ký?</AlertDialogTitle>

            <AlertDialogDescription>
              Sau khi hủy bạn sẽ phải đăng ký lại từ đầu.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (cancelId) {
                  cancelApplication(cancelId);
                  setCancelId(null);
                }
              }}
            >
              Hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

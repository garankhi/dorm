import { BedDouble, Users, CheckCircle2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/dorm";

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

  const loadRooms = async () => {
    try {
      const res = await api.get("/DormApplications/rooms");
      setRooms(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get("/DormApplications/me");
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
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
      await api.post("/DormApplications", {
        roomId,
      });

      setApplied(roomId);
      loadRooms();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Đăng ký thất bại");
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
          const isApplied = appliedRoomIds.has(room.id);
          const full = room.available === 0 || isApplied;
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
                {isApplied ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 size={13} /> Đã nộp đơn
                  </span>
                ) : (
                  <button
                    disabled={full}
                    onClick={() => registerRoom(room.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isApplied ? "Đã đăng ký" : full ? "Hết chỗ" : "Đăng ký"}
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
    </div>
  );
}

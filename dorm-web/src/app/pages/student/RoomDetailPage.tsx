import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import api from "../../api/dorm";
import { toast } from "sonner";
import { 
  BedDouble, 
  Users, 
  ArrowLeft, 
  Wifi, 
  Tv, 
  Wind, 
  IceCream,
  Container,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Building,
  Layers,
  Sparkles
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "../../components/ui/alert-dialog";

interface Amenity {
  id: string;
  name: string;
}

interface RoomDetail {
  id: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  roomGender: string;
  roomType: string;
  capacity: number;
  currentOccupancy: number;
  available: number;
  pricePerMonth: number;
  status: string;
  description?: string;
  amenities: Amenity[];
}

const getAmenityIcon = (name: string) => {
  const normalizeName = name.toLowerCase();
  if (normalizeName.includes("điều hoà") || normalizeName.includes("máy lạnh")) return <Wind size={18} className="text-blue-500" />;
  if (normalizeName.includes("tủ lạnh")) return <IceCream size={18} className="text-cyan-500" />;
  if (normalizeName.includes("tivi") || normalizeName.includes("tv")) return <Tv size={18} className="text-indigo-500" />;
  if (normalizeName.includes("giường")) return <BedDouble size={18} className="text-purple-500" />;
  if (normalizeName.includes("bàn học")) return <BookOpen size={18} className="text-amber-600" />;
  if (normalizeName.includes("tủ đồ") || normalizeName.includes("tủ cá nhân")) return <Container size={18} className="text-emerald-600" />;
  if (normalizeName.includes("wifi")) return <Wifi size={18} className="text-sky-500" />;
  
  return <CheckCircle size={18} className="text-gray-400" />;
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<any | null>(null);
  const [registerRoomId, setRegisterRoomId] = useState<string | null>(null); 
  const [cancelId, setCancelId] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      const res = await api.get("/DormApplications/me");
      const mapped = res.data.map((x: any) => ({
        id: x.id,
        roomId: x.roomId,
        status: x.status,
      }));
      setApplications(mapped);
      const active = mapped.find((x: any) => x.status === "pending");
      setActiveApp(active || null);
    } catch (err) {
      console.error("Không thể tải đơn đăng ký", err);
    }
  };

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${id}`);
      setRoom(res.data);
    } catch (err: any) {
      toast.error("Không thể tải thông tin chi tiết phòng.");
      navigate("/student/rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoomDetail();
      loadApplications();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) return null;

  const isFull = room.available === 0;
  const isMyRoom = activeApp?.roomId === room.id;
  const hasActiveApplication = !!activeApp;
  const isApplied = applications.some((a) => a.roomId === room.id);

  const registerRoom = async (roomId: string) => {
    try {
      if (activeApp && activeApp.roomId !== roomId) {
        toast.error("Bạn đang có đơn đăng ký phòng khác. Vui lòng hủy đơn trước.");
        return;
      }

      await api.post("/DormApplications", { roomId });
      await loadApplications();
      toast.success("Đăng ký phòng thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Đăng ký thất bại");
    }
  };

  const cancelApplication = async (applicationId: string) => {
    try {
      await api.delete(`/DormApplications/${applicationId}`);
      await loadApplications();
      toast.success("Đã hủy đơn đăng ký thành công");
    } catch {
      toast.error("Hủy đơn thất bại");
    }
  };

  // Hàm chuyển đổi Loại phòng
const formatRoomType = (type: string) => {
  const mapping: Record<string, string> = {
    room_2: "Phòng 2 người",
    room_4: "Phòng 4 người",
    room_6: "Phòng 6 người",
    room_8: "Phòng 8 người",
  };
  return mapping[type] || type; // Nếu không khớp thì giữ nguyên giá trị cũ
};

// Hàm chuyển đổi Trạng thái phòng
const formatRoomStatus = (status: string) => {
  const mapping: Record<string, string> = {
    available: "Còn chỗ",
    full: "Hết chỗ",
  };
  return mapping[status.toLowerCase()] || status;
};

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Header thông tin phòng */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BedDouble size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Phòng {room.roomNumber}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                room.roomGender.toLowerCase() === "male" || room.roomGender.toLowerCase() === "nam"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-pink-50 text-pink-600 border border-pink-200"
              }`}>
                Phòng {room.roomGender.toLowerCase() === "male" || room.roomGender.toLowerCase() === "nam" ? "Nam" : "Nữ"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Building size={14} /> Tòa nhà {room.buildingName} · <Layers size={14} /> Tầng {room.floor}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold text-primary">
            {room.pricePerMonth.toLocaleString("vi-VN")}₫
            <span className="text-xs font-normal text-muted-foreground"> / tháng</span>
          </p>
          <p className={`text-sm font-medium mt-1 ${isFull ? "text-red-500" : "text-green-600"}`}>
            {isFull ? "Hiện đã hết chỗ" : `Còn trống ${room.available} / ${room.capacity} chỗ`}
          </p>
        </div>
      </div>

      {/* Grid nội dung chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin tổng quan & Mô tả */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Thông tin loại phòng
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl">
              <div>
                <span className="text-muted-foreground block text-xs">Loại phòng</span>
                <span className="font-medium text-foreground">{formatRoomType(room.roomType)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Trạng thái phòng</span>
                <span className="font-medium text-foreground capitalize">{formatRoomStatus(room.status)}</span>
              </div>
            </div>

            {room.description && (
              <div className="pt-2">
                <span className="text-muted-foreground block text-xs mb-1">Mô tả thêm</span>
                <p className="text-sm text-foreground leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {room.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: HIỂN THỊ AMENITIES & Nút hành động */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              Danh sách tiện ích
            </h2>

            {room.amenities && room.amenities.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {room.amenities.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-slate-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {getAmenityIcon(item.name)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-border">
                <HelpCircle size={24} className="mx-auto mb-1.5 opacity-40" />
                <p className="text-xs">Phòng này chưa cấu hình tiện ích riêng.</p>
              </div>
            )}

            {/* Nút hành động xử lý nghiệp vụ y hệt roomspage */}
            <div className="pt-2">
              {isMyRoom ? (
                <div className="flex flex-col gap-2 bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                  <span className="text-green-600 text-sm font-semibold">
                    Đang chọn
                  </span>
                  <button
                    onClick={() => setCancelId(activeApp.id)}
                    className="text-xs px-3 py-1.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
                  >
                    Hủy đơn đăng ký
                  </button>
                </div>
              ) : isApplied ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-dashed text-center">
                  <span className="text-muted-foreground text-xs font-medium">
                    Bạn đã nộp đơn đăng ký phòng khác
                  </span>
                </div>
              ) : (
                <button
                  disabled={isFull}
                  onClick={() => {
                    if (hasActiveApplication) {
                      toast.error("Bạn đang có đơn đăng ký phòng khác. Vui lòng hủy đơn cũ trước.");
                      return;
                    }
                    setRegisterRoomId(room.id);
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-95 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  {isFull ? "Hết chỗ" : "Đăng ký phòng"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Xác Nhận Đăng Ký */}
      <AlertDialog open={!!registerRoomId} onOpenChange={() => setRegisterRoomId(null)}>
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
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
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
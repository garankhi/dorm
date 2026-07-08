import React, { useState, useEffect, useRef } from "react";
import {
  Wrench,
  Plus,
  X,
  Send,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Trash2,
  Building,
  Check,
  Filter,
  Search,
  Calendar,
  MapPin,
  Eye,
  Info,
  ChevronRight,
} from "lucide-react";
import { getCurrentUser } from "../../auth";

// --- Interfaces ---
interface Comment {
  id: string;
  sender: "student" | "admin";
  senderName: string;
  content: string;
  sentAt: string;
  imageUrl?: string;
}

type TicketStatus = "submitted" | "inprogress" | "resolved" | "reopened" | "closed" | "cancelled";
type TicketSeverity = "normal" | "urgent" | "critical";

interface MaintenanceTicket {
  id: string;
  room: string;
  issueType: string;
  location: string;
  severity: TicketSeverity;
  description: string;
  status: TicketStatus;
  sentDate: string;
  preferredTime?: string;
  proofUrl?: string;
  comments: Comment[];
}

// --- Status Styles & Labels ---
const statusConfig = {
  submitted: {
    label: "Đã gửi",
    className: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-500",
  },
  inprogress: {
    label: "Đang sửa chữa",
    className: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Đã xử lý (Chờ xác nhận)",
    className: "bg-green-50 text-green-600 border-green-200",
    dot: "bg-green-500",
  },
  reopened: {
    label: "Chưa đạt (Mở lại)",
    className: "bg-purple-50 text-purple-600 border-purple-200",
    dot: "bg-purple-500",
  },
  closed: {
    label: "Đã đóng",
    className: "bg-slate-50 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-50 text-rose-500 border-rose-200",
    dot: "bg-rose-400",
  },
};

const severityConfig = {
  normal: {
    label: "Bình thường",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  urgent: {
    label: "Cần sớm",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  critical: {
    label: "Khẩn cấp",
    className: "bg-red-100 text-red-700 border-red-200 animate-pulse",
  },
};

// --- Mock Initial Data ---
const initialTickets: MaintenanceTicket[] = [
  {
    id: "REQ-8915",
    room: "Phòng A-102",
    issueType: "Điện",
    location: "Trần nhà chính",
    severity: "urgent",
    description: "Bóng đèn tuýp LED ở trần chính phòng bị nhấp nháy liên tục rồi tắt hẳn, trong phòng hiện tại rất tối.",
    status: "submitted",
    sentDate: "08/07/2026 21:00",
    preferredTime: "Cả ngày thứ 5 và thứ 6",
    comments: [],
  },
  {
    id: "REQ-8902",
    room: "Phòng A-102",
    issueType: "Nước",
    location: "Nhà vệ sinh",
    severity: "critical",
    description: "Vòi xịt bồn vệ sinh rò rỉ nước liên tục từ khớp nối ở chân vòi, làm nước chảy tràn ra sàn nhà vệ sinh gây trơn trượt nguy hiểm.",
    status: "resolved",
    sentDate: "07/07/2026 09:30",
    preferredTime: "Chiều thứ 3, từ 14h - 17h",
    proofUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60",
    comments: [
      {
        id: "c1",
        sender: "student",
        senderName: "Nguyễn Văn A",
        content: "Em gửi kèm ảnh chỗ bị nứt ở khớp ren nối vòi xịt ạ. Nước chảy khá mạnh nên em tạm thời phải khóa van tổng.",
        sentAt: "07/07/2026 09:32",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60",
      },
      {
        id: "c2",
        sender: "admin",
        senderName: "Kỹ Thuật Viên (Vương)",
        content: "Chào em, anh đã tiếp nhận yêu cầu. Chiều nay tầm 15h anh qua thay dây vòi xịt mới và kiểm tra van nước nhé.",
        sentAt: "07/07/2026 11:15",
      },
      {
        id: "c3",
        sender: "admin",
        senderName: "Kỹ Thuật Viên (Vương)",
        content: "Anh đã qua thay vòi xịt nước inox mới và siết lại van cao su chống rò rỉ. Anh chuyển trạng thái Resolved, em kiểm tra lại rồi bấm xác nhận giúp anh nhé.",
        sentAt: "07/07/2026 15:40",
      },
    ],
  },
  {
    id: "REQ-8891",
    room: "Phòng A-102",
    issueType: "Internet",
    location: "Bàn học",
    severity: "normal",
    description: "Mạng Wifi ký túc xá chập chờn, thường xuyên bị rớt mạng và báo 'No internet' từ lúc 20h đến 23h đêm.",
    status: "inprogress",
    sentDate: "06/07/2026 15:45",
    preferredTime: "Sau 18:00 hàng ngày",
    comments: [
      {
        id: "c4",
        sender: "student",
        senderName: "Nguyễn Văn A",
        content: "Cứ đến giờ cao điểm học bài tối là mạng không thể kết nối nổi, mong IT hỗ trợ reset hoặc kiểm tra cục phát ở hành lang tầng 1 ạ.",
        sentAt: "06/07/2026 15:47",
      },
      {
        id: "c5",
        sender: "admin",
        senderName: "Hệ thống IT (Duy)",
        content: "IT đã kiểm tra cục phát AP hành lang dãy A1. Nhận thấy lượng truy cập tải cao gây nghẽn băng thông. Đang lên phương án phân bổ lại cấu hình kênh phát và giới hạn băng thông từng user.",
        sentAt: "07/07/2026 08:30",
      },
    ],
  },
  {
    id: "REQ-8810",
    room: "Phòng A-102",
    issueType: "Nội thất",
    location: "Giường ngủ",
    severity: "normal",
    description: "Thanh nan chắn gỗ giường tầng trên bị nứt một đường dài, khi nằm nghe tiếng cọt kẹt lớn sợ bị gãy đổ.",
    status: "closed",
    sentDate: "30/06/2026 10:00",
    comments: [
      {
        id: "c6",
        sender: "student",
        senderName: "Nguyễn Văn A",
        content: "Thanh gỗ bị nứt dọc thân giường gác lửng bên phải ạ.",
        sentAt: "30/06/2026 10:02",
      },
      {
        id: "c7",
        sender: "admin",
        senderName: "Đội Mộc (Chú Sáu)",
        content: "Chú đã qua thay thanh nan gỗ sồi mới chắc chắn hơn cho cháu rồi nhé.",
        sentAt: "01/07/2026 14:20",
      },
      {
        id: "c8",
        sender: "student",
        senderName: "Nguyễn Văn A",
        content: "Dạ giường nằm chắc chắn êm lắm rồi ạ, con cảm ơn chú Sáu nhiều.",
        sentAt: "01/07/2026 18:00",
      },
    ],
  },
];

export default function MaintenancePage() {
  const user = getCurrentUser();

  // --- States ---
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem(`dorm_maintenance_tickets_${user?.email}`);
    return saved ? JSON.parse(saved) : initialTickets;
  });
  const [hasRoom, setHasRoom] = useState(true); // Toggle to simulate "No Room" state
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Form State
  const [issueType, setIssueType] = useState("Điện");
  const [location, setLocation] = useState("Cửa");
  const [severity, setSeverity] = useState<TicketSeverity>("normal");
  const [description, setDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentPreview, setCommentPreview] = useState<string | null>(null);

  // Custom Confirmation / Prompt Dialog Modal State
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    type: "cancel" | "reopen";
    ticketId: string;
    title: string;
    message: string;
    inputValue: string;
    errorText?: string;
  }>({
    isOpen: false,
    type: "cancel",
    ticketId: "",
    title: "",
    message: "",
    inputValue: "",
  });

  // Custom Toast Notification State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(`dorm_maintenance_tickets_${user?.email}`, JSON.stringify(tickets));
  }, [tickets, user]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (selectedTicket) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.comments, selectedTicket]);

  // --- Toast Helper ---
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- Actions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    }
  };

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCommentFile(file);
      const url = URL.createObjectURL(file);
      setCommentPreview(url);
    }
  };

  const removeProofImage = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
  };

  const removeCommentImage = () => {
    setCommentFile(null);
    if (commentPreview) {
      URL.revokeObjectURL(commentPreview);
      setCommentPreview(null);
    }
  };

  // Submit Ticket Form
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasRoom) {
      showToast("Bạn không thể tạo yêu cầu khi chưa được phân phòng lưu trú!", "error");
      return;
    }

    if (!description.trim()) {
      showToast("Vui lòng mô tả chi tiết sự cố gặp phải.", "error");
      return;
    }

    const newTicketId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: MaintenanceTicket = {
      id: newTicketId,
      room: "Phòng A-102",
      issueType,
      location,
      severity,
      description: description.trim(),
      status: "submitted",
      sentDate: new Date().toLocaleString("vi-VN", { hour12: false }),
      preferredTime: preferredTime.trim() || "Cả ngày",
      proofUrl: proofPreview || undefined,
      comments: proofPreview ? [
        {
          id: `c-init-${Date.now()}`,
          sender: "student",
          senderName: user?.name || "Sinh viên",
          content: `Ảnh minh chứng đính kèm lúc tạo yêu cầu: ${description.trim()}`,
          sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
          imageUrl: proofPreview,
        }
      ] : [],
    };

    setTickets((prev) => [newTicket, ...prev]);
    showToast(`Đã gửi yêu cầu báo hỏng ${newTicketId} thành công!`, "success");

    // Reset Form
    setDescription("");
    setPreferredTime("");
    setProofFile(null);
    setProofPreview(null);
  };

  // Post Comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!newComment.trim() && !commentPreview) return;

    const newCommentObj: Comment = {
      id: `c-${Date.now()}`,
      sender: "student",
      senderName: user?.name || "Sinh viên",
      content: newComment.trim(),
      sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
      imageUrl: commentPreview || undefined,
    };

    // Update tickets state
    const updatedTickets = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        const updatedComments = [...t.comments, newCommentObj];
        const updatedT = { ...t, comments: updatedComments };
        // Sync selectedTicket too
        setSelectedTicket(updatedT);
        return updatedT;
      }
      return t;
    });

    setTickets(updatedTickets);
    setNewComment("");
    setCommentFile(null);
    setCommentPreview(null);
    showToast("Đã gửi bình luận.", "success");

    // Simulate Admin Auto-reply after 2.5 seconds
    const ticketIdToReply = selectedTicket.id;
    setTimeout(() => {
      setTickets((currentTickets) => {
        return currentTickets.map((t) => {
          if (t.id === ticketIdToReply && t.status !== "closed" && t.status !== "cancelled") {
            const adminReply: Comment = {
              id: `c-admin-${Date.now()}`,
              sender: "admin",
              senderName: "BQL Ký Túc Xá (Tự động)",
              content: "Xin chào! Ban Quản lý đã nhận được bình luận bổ sung của bạn. Kỹ thuật viên phụ trách sửa chữa sẽ phản hồi hoặc liên hệ trực tiếp cho bạn sớm nhất có thể.",
              sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
            };
            const finalComments = [...t.comments, adminReply];
            const finalT = { ...t, comments: finalComments };

            // Update selectedTicket if it is still open and matches
            setSelectedTicket((currentSel) => {
              if (currentSel && currentSel.id === ticketIdToReply) {
                return finalT;
              }
              return currentSel;
            });

            return finalT;
          }
          return t;
        });
      });
    }, 2500);
  };

  // Trigger Cancellation Custom Dialog
  const triggerCancelConfirm = (ticketId: string) => {
    setCustomDialog({
      isOpen: true,
      type: "cancel",
      ticketId,
      title: "Hủy yêu cầu báo hỏng",
      message: `Bạn có chắc chắn muốn hủy yêu cầu báo hỏng ${ticketId}? Hành động này không thể hoàn tác.`,
      inputValue: "",
    });
  };

  // Trigger Reopen Custom Dialog Prompt
  const triggerReopenPrompt = (ticketId: string) => {
    setCustomDialog({
      isOpen: true,
      type: "reopen",
      ticketId,
      title: "Báo lỗi chưa sửa xong",
      message: "Vui lòng ghi rõ lý do hoặc biểu hiện sự cố chưa được khắc phục để kỹ thuật viên nắm thông tin:",
      inputValue: "",
      errorText: "",
    });
  };

  // Unified Custom Dialog Submission Handler
  const handleDialogSubmit = () => {
    const { type, ticketId, inputValue } = customDialog;
    if (type === "cancel") {
      const updated = tickets.map((t) => {
        if (t.id === ticketId) {
          const updatedT = { ...t, status: "cancelled" as TicketStatus };
          if (selectedTicket?.id === ticketId) {
            setSelectedTicket(updatedT);
          }
          return updatedT;
        }
        return t;
      });
      setTickets(updated);
      showToast(`Đã hủy yêu cầu sửa chữa ${ticketId}`, "info");
      setCustomDialog((prev) => ({ ...prev, isOpen: false }));
    } else if (type === "reopen") {
      if (!inputValue.trim()) {
        setCustomDialog((prev) => ({ ...prev, errorText: "Vui lòng nhập lý do chưa khắc phục xong." }));
        return;
      }
      const updated = tickets.map((t) => {
        if (t.id === ticketId) {
          const studentComment: Comment = {
            id: `c-reopen-${Date.now()}`,
            sender: "student",
            senderName: user?.name || "Sinh viên",
            content: `⚠ Báo cáo lỗi chưa khắc phục xong. Yêu cầu sửa lại. Lý do: ${inputValue.trim()}`,
            sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
          };
          const updatedT = {
            ...t,
            status: "reopened" as TicketStatus,
            comments: [...t.comments, studentComment],
          };
          if (selectedTicket?.id === ticketId) {
            setSelectedTicket(updatedT);
          }
          return updatedT;
        }
        return t;
      });
      setTickets(updated);
      showToast(`Đã mở lại yêu cầu sửa chữa ${ticketId}`, "info");
      setCustomDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Close Ticket (Resolved -> Closed)
  const handleConfirmResolved = (ticketId: string) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        // Add final comment indicating resolved
        const systemComment: Comment = {
          id: `c-sys-${Date.now()}`,
          sender: "student",
          senderName: user?.name || "Sinh viên",
          content: "✓ Xác nhận: Thiết bị đã được sửa xong hoạt động tốt. Đóng yêu cầu.",
          sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
        };
        const updatedT = {
          ...t,
          status: "closed" as TicketStatus,
          comments: [...t.comments, systemComment],
        };
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updatedT);
        }
        return updatedT;
      }
      return t;
    });
    setTickets(updated);
    showToast(`Đã đóng yêu cầu sửa chữa ${ticketId}`, "success");
  };

  // Reopen Ticket (Resolved -> Reopened)
  const handleReopenTicket = (ticketId: string, reason: string) => {
    if (!reason.trim()) {
      showToast("Vui lòng ghi rõ lý do chưa hoàn thành.", "error");
      return;
    }

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const studentComment: Comment = {
          id: `c-reopen-${Date.now()}`,
          sender: "student",
          senderName: user?.name || "Sinh viên",
          content: `⚠ Báo cáo lỗi chưa khắc phục xong. Yêu cầu sửa lại. Lý do: ${reason.trim()}`,
          sentAt: new Date().toLocaleString("vi-VN", { hour12: false }),
        };
        const updatedT = {
          ...t,
          status: "reopened" as TicketStatus,
          comments: [...t.comments, studentComment],
        };
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updatedT);
        }
        return updatedT;
      }
      return t;
    });
    setTickets(updated);
    showToast(`Đã mở lại yêu cầu sửa chữa ${ticketId}`, "info");
  };

  // --- Filtering ---
  const filteredTickets = tickets.filter((t) => {
    // Search query match (id, issue type, location, description)
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab match
    if (activeTab === "active") {
      return ["submitted", "inprogress", "resolved", "reopened"].includes(t.status);
    }
    if (activeTab === "closed") {
      return ["closed", "cancelled"].includes(t.status);
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto relative min-h-screen">
      {/* Toast Notification Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-top-4 duration-300 ${
              t.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : t.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            ) : t.type === "error" ? (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            ) : (
              <Info size={18} className="text-blue-600 shrink-0" />
            )}
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Header & Simulator Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Wrench className="text-primary" size={24} /> Báo cáo sự cố & Hư hỏng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gửi yêu cầu sửa chữa cơ sở vật chất phòng KTX và trao đổi trực tiếp với kỹ thuật viên.
          </p>
        </div>

        {/* State Simulator Switch (Helpful for demo review) */}
        <div className="bg-white border border-border p-3 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${hasRoom ? "bg-green-500" : "bg-red-500"}`} />
            <div>
              <p className="text-xs font-semibold text-foreground">Giả lập trạng thái phân phòng</p>
              <p className="text-[10px] text-muted-foreground">
                {hasRoom ? "Đang có phòng lưu trú" : "Không có phòng lưu trú"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setHasRoom(!hasRoom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
              hasRoom
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
            }`}
          >
            {hasRoom ? "Giả lập Không Phòng" : "Giả lập Có Phòng"}
          </button>
        </div>
      </div>

      {/* Active Room Guard Banner */}
      {hasRoom ? (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium tracking-wide uppercase">Phòng lưu trú hiện tại</p>
            <p className="text-base font-semibold text-foreground mt-0.5">Phòng A-102</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Hợp đồng liên quan</p>
            <p className="text-sm font-medium text-foreground">HĐ #CON-20260705</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-4 animate-in fade-in duration-300">
          <AlertCircle size={22} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Không tìm thấy phòng lưu trú hợp lệ</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Hệ thống ghi nhận bạn chưa có hợp đồng lưu trú hoặc phân phòng hoạt động (Active). 
              Bạn chỉ có thể báo cáo hư hỏng thiết bị khi đang lưu trú tại Ký túc xá. Vui lòng liên hệ Ban quản lý nếu đây là sai sót.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form to create new repair request */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-border p-5 md:p-6 shadow-sm sticky top-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Plus size={18} className="text-primary" /> Tạo yêu cầu mới
            </h2>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              {/* Row 1: Issue Type & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Loại sự cố</label>
                  <select
                    disabled={!hasRoom}
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-[#f5f6fa] border border-transparent rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {["Điện", "Nước", "Internet", "Nội thất", "Vệ sinh", "Khác"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Vị trí trong phòng</label>
                  <select
                    disabled={!hasRoom}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#f5f6fa] border border-transparent rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {["Cửa", "Giường", "Nhà vệ sinh", "Bàn học", "Ban công", "Khác"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Severity */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mức độ ưu tiên</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["normal", "urgent", "critical"] as TicketSeverity[]).map((level) => {
                    const active = severity === level;
                    let colorStyles = "";
                    if (level === "normal") {
                      colorStyles = active ? "border-slate-500 bg-slate-50 text-slate-900" : "hover:bg-slate-50 border-border text-muted-foreground";
                    } else if (level === "urgent") {
                      colorStyles = active ? "border-amber-500 bg-amber-50 text-amber-900" : "hover:bg-amber-50/50 border-border text-muted-foreground";
                    } else {
                      colorStyles = active ? "border-red-500 bg-red-50 text-red-950" : "hover:bg-red-50/50 border-border text-muted-foreground";
                    }

                    return (
                      <button
                        key={level}
                        type="button"
                        disabled={!hasRoom}
                        onClick={() => setSeverity(level)}
                        className={`border rounded-xl py-2 px-1 text-xs font-medium text-center transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colorStyles}`}
                      >
                        {level === "normal" && "Bình thường"}
                        {level === "urgent" && "Cần sớm"}
                        {level === "critical" && "Khẩn cấp"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả sự cố</label>
                <textarea
                  disabled={!hasRoom}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng mô tả chi tiết vị trí và biểu hiện sự cố để kỹ thuật viên dễ xác định lỗi..."
                  className="w-full bg-[#f5f6fa] border border-transparent rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Preferred time */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-muted-foreground" /> Thời gian có thể liên hệ sửa chữa
                </label>
                <input
                  disabled={!hasRoom}
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="Ví dụ: Rảnh chiều T3 và T5 từ 13h-17h..."
                  className="w-full bg-[#f5f6fa] border border-transparent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Attachment image */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-muted-foreground" /> Ảnh đính kèm (nếu có)
                </label>

                {proofPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border w-full h-36 bg-slate-50 group">
                    <img src={proofPreview} alt="Preview proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeProofImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-all scale-90 active:scale-75"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 rounded-xl py-5 px-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer group disabled:opacity-50">
                    <ImageIcon size={22} className="text-slate-400 group-hover:text-primary transition mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Tải ảnh lên</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ PNG, JPG (Tối đa 5MB)</span>
                    <input
                      disabled={!hasRoom}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!hasRoom}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition active:scale-98 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                <Plus size={16} /> Gửi yêu cầu sửa chữa
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Ticket List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Controls & Filter Panel */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Tab Filters */}
            <div className="flex bg-[#f5f6fa] p-1 rounded-xl w-full sm:w-auto">
              {[
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Đang sửa" },
                { id: "closed", label: "Đã đóng" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === tab.id
                      ? "bg-white text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã yêu cầu, sự cố..."
                className="w-full bg-[#f5f6fa] border border-transparent rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Ticket Listing */}
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border py-16 text-center text-muted-foreground shadow-sm">
              <Wrench size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-medium">Không tìm thấy yêu cầu sửa chữa nào</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hãy thử thay đổi bộ lọc hoặc gõ từ khóa khác.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTickets.map((ticket) => {
                const statusInfo = statusConfig[ticket.status] || statusConfig.submitted;
                const severityInfo = severityConfig[ticket.severity] || severityConfig.normal;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:border-slate-300 transition duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Top Info line */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider">
                          {ticket.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {ticket.issueType} ({ticket.location})
                        </span>
                        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${severityInfo.className}`}>
                          {severityInfo.label}
                        </span>
                      </div>

                      {/* Main description */}
                      <p className="text-sm text-foreground font-medium truncate group-hover:text-primary transition-colors">
                        {ticket.description}
                      </p>

                      {/* Room & date line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building size={12} /> {ticket.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Gửi ngày: {ticket.sentDate}
                        </span>
                        {ticket.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <MessageSquare size={12} /> {ticket.comments.length} thảo luận
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge & detail click action */}
                    <div className="flex items-center justify-between md:justify-end gap-3.5 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                      <button className="p-1.5 text-muted-foreground group-hover:text-primary transition bg-slate-50 group-hover:bg-primary/5 rounded-xl border border-transparent">
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- Ticket Detail & Chat Thread Modal --- */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-border animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">{selectedTicket.id}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig[selectedTicket.status]?.className}`}>
                    {statusConfig[selectedTicket.status]?.label}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mt-1">
                  Yêu cầu: {selectedTicket.issueType} ở {selectedTicket.location}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  removeCommentImage();
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 text-muted-foreground hover:text-foreground transition active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Container */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
              
              {/* Left Column: Ticket details & Action buttons */}
              <div className="md:col-span-5 p-5 md:p-6 space-y-5 bg-slate-50/20">
                
                {/* Details Section */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thông tin yêu cầu</h4>

                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Phòng liên quan</p>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <Building size={13} className="text-slate-400" /> {selectedTicket.room}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Mức độ ưu tiên</p>
                    <span className={`inline-block text-[10px] font-semibold border px-2.5 py-0.5 rounded-full mt-1 ${severityConfig[selectedTicket.severity]?.className}`}>
                      {severityConfig[selectedTicket.severity]?.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Thời gian liên hệ</p>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <Calendar size={13} className="text-slate-400" /> {selectedTicket.preferredTime || "Cả ngày"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Mô tả sự cố</p>
                    <p className="text-xs text-foreground mt-0.5 leading-relaxed bg-white border border-border p-2.5 rounded-xl">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {selectedTicket.proofUrl && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Ảnh minh chứng</p>
                      <a href={selectedTicket.proofUrl} target="_blank" rel="noreferrer" className="block relative rounded-xl overflow-hidden border border-border w-full h-24 mt-1 bg-slate-50 group hover:opacity-90 transition">
                        <img src={selectedTicket.proofUrl} alt="Ticket proof" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-[8px] text-white px-1.5 py-0.5 rounded">Click xem lớn</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Stepper progress tracker */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Trạng thái xử lý</h4>
                  <div className="space-y-2">
                    {[
                      { step: "submitted", label: "Đã gửi yêu cầu", active: true },
                      { step: "inprogress", label: "Đang sửa chữa", active: ["inprogress", "resolved", "reopened", "closed"].includes(selectedTicket.status) },
                      { step: "resolved", label: "Đã xử lý (Chờ xác nhận)", active: ["resolved", "closed"].includes(selectedTicket.status) },
                      { step: "closed", label: "Đã đóng", active: selectedTicket.status === "closed" },
                    ].map((st, idx) => {
                      const isCancelled = selectedTicket.status === "cancelled" && st.step !== "submitted";
                      if (isCancelled) return null;

                      let checkIconColor = "bg-slate-200 text-slate-400";
                      if (st.active) checkIconColor = "bg-primary text-white";
                      if (selectedTicket.status === "resolved" && st.step === "resolved") checkIconColor = "bg-green-600 text-white animate-bounce";
                      if (selectedTicket.status === "reopened" && st.step === "inprogress") checkIconColor = "bg-purple-600 text-white";
                      
                      return (
                        <div key={st.step} className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${checkIconColor} shrink-0`}>
                            {st.step === "closed" && selectedTicket.status === "closed" ? <Check size={10} /> : (idx + 1)}
                          </div>
                          <span className={`text-xs ${st.active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            {selectedTicket.status === "reopened" && st.step === "inprogress" ? "Mở lại & Đang xử lý" : st.label}
                          </span>
                        </div>
                      );
                    })}
                    {selectedTicket.status === "cancelled" && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shrink-0">
                          <X size={10} />
                        </div>
                        <span className="text-xs font-semibold text-rose-600">Đã hủy yêu cầu</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {/* Cancel Request (Submitted Only) */}
                  {selectedTicket.status === "submitted" && (
                    <button
                      onClick={() => triggerCancelConfirm(selectedTicket.id)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-2 px-4 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} /> Hủy yêu cầu báo hỏng
                    </button>
                  )}

                  {/* Resolve and Confirm (Resolved Only) */}
                  {selectedTicket.status === "resolved" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleConfirmResolved(selectedTicket.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={13} /> Xác nhận sửa xong (Đóng)
                      </button>
                      
                      <button
                        onClick={() => triggerReopenPrompt(selectedTicket.id)}
                        className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 py-2 px-4 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle size={13} /> Lỗi chưa sửa xong (Yêu cầu lại)
                      </button>
                    </div>
                  )}

                  {/* Closed / Cancelled text */}
                  {(selectedTicket.status === "closed" || selectedTicket.status === "cancelled") && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
                      Yêu cầu sửa chữa này đã kết thúc xử lý. 
                      Không thể chỉnh sửa hoặc bình luận.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Chat/Ticket Thread */}
              <div className="md:col-span-7 flex flex-col h-[50vh] md:h-auto min-h-[300px]">
                {/* Conversation Title */}
                <div className="px-4 py-2 bg-slate-50 border-b border-border flex items-center gap-1.5 shrink-0">
                  <MessageSquare size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">Hộp thư trao đổi (Ticket Ticket)</span>
                </div>

                {/* Comment Thread Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
                  {selectedTicket.comments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center">
                      <MessageSquare size={24} className="opacity-20 mb-2" />
                      <p className="text-xs font-medium">Chưa có thảo luận nào</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Sinh viên và Ban quản lý có thể trao đổi ý kiến bên dưới.</p>
                    </div>
                  ) : (
                    selectedTicket.comments.map((comment) => {
                      const isAdmin = comment.sender === "admin";
                      return (
                        <div
                          key={comment.id}
                          className={`flex flex-col max-w-[85%] ${isAdmin ? "mr-auto" : "ml-auto"}`}
                        >
                          <div className={`flex items-center gap-1.5 mb-1 px-1 ${isAdmin ? "justify-start" : "justify-end"}`}>
                            <span className="text-[10px] font-semibold text-slate-700">{comment.senderName}</span>
                            <span className="text-[9px] text-slate-400">{comment.sentAt}</span>
                          </div>
                          
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-xs border ${
                              isAdmin
                                ? "bg-white text-slate-800 border-slate-200"
                                : "bg-primary text-white border-transparent shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-line leading-relaxed">{comment.content}</p>
                            
                            {comment.imageUrl && (
                              <a href={comment.imageUrl} target="_blank" rel="noreferrer" className="block mt-2 rounded-lg overflow-hidden max-w-full max-h-36 border border-black/5 bg-slate-900/5">
                                <img src={comment.imageUrl} alt="Comment attachment" className="w-full h-full object-contain" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Comment Input Bar */}
                <div className="p-3 border-t border-border bg-white shrink-0">
                  {selectedTicket.status !== "closed" && selectedTicket.status !== "cancelled" ? (
                    <form onSubmit={handlePostComment} className="space-y-2">
                      
                      {/* Image preview for comment */}
                      {commentPreview && (
                        <div className="relative inline-block rounded-xl overflow-hidden border border-border w-24 h-16 bg-slate-50 group">
                          <img src={commentPreview} alt="Comment preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeCommentImage}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-black transition-all scale-75"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        {/* Image upload button */}
                        <label className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-50 transition cursor-pointer shrink-0 active:scale-95">
                          <Paperclip size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCommentFileChange}
                            className="hidden"
                          />
                        </label>

                        {/* Text Input */}
                        <textarea
                          rows={1}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment(e);
                            }
                          }}
                          placeholder="Nhập phản hồi hoặc bổ sung thông tin..."
                          className="flex-1 max-h-24 bg-[#f5f6fa] border border-transparent rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition resize-none py-2.5"
                        />

                        {/* Send button */}
                        <button
                          type="submit"
                          disabled={!newComment.trim() && !commentPreview}
                          className="p-2.5 bg-primary disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition hover:bg-primary/95 active:scale-95 shrink-0"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[10px] text-center text-muted-foreground">
                      Không thể trả lời vì yêu cầu sửa chữa đã đóng hoặc đã hủy.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation / Prompt Dialog Modal */}
      {customDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-border p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {customDialog.type === "cancel" ? (
                  <AlertTriangle className="text-rose-500 animate-bounce" size={18} />
                ) : (
                  <AlertCircle className="text-purple-500" size={18} />
                )}
                {customDialog.title}
              </h3>
              <button
                onClick={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-full hover:bg-slate-100 text-muted-foreground transition active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {customDialog.message}
            </p>

            {customDialog.type === "reopen" && (
              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={customDialog.inputValue}
                  onChange={(e) =>
                    setCustomDialog((prev) => ({
                      ...prev,
                      inputValue: e.target.value,
                      errorText: "",
                    }))
                  }
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full bg-[#f5f6fa] border border-transparent rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition resize-none"
                />
                {customDialog.errorText && (
                  <p className="text-[10px] text-rose-500 font-semibold">{customDialog.errorText}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-slate-50 transition active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDialogSubmit}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition active:scale-95 shadow-sm ${
                  customDialog.type === "cancel"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileImage,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import AdminModal from "./AdminModal";
import AdminPagination from "./AdminPagination";
import {
  type AdminMaintenance,
  type AdminMaintenanceDetail,
  type MaintenanceAttachment,
  type MaintenanceHistoryItem,
  type RoomMaintenanceThreadResponse,
  type RoomMaintenanceThreadItem,
  fetchAdminMaintenance,
  fetchAdminMaintenanceHistory,
  fetchAdminMaintenances,
  fetchRoomMaintenanceThread,
  postMaintenanceComment,
  uploadMaintenanceAttachment,
  updateAdminMaintenance,
} from "./adminMaintenancesApi";
import { formatDate } from "../../libs/format";
import {
  getRoomFloor,
  maintenanceIssueTypeOptions,
  maintenanceSeverityOptions,
  maintenanceStatusConfig,
  maintenanceStatusOptions,
  type MaintenanceIssueType,
  type MaintenanceSeverity,
  type MaintenanceStatus,
} from "./adminMaintenancesData";

const PAGE_SIZE = 6;

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const { label, icon: Icon, className } = maintenanceStatusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: MaintenanceSeverity }) {
  const config = {
    low: "border-green-200 bg-green-50 text-green-700",
    medium: "border-slate-200 bg-slate-50 text-slate-700",
    high: "border-amber-200 bg-amber-50 text-amber-700",
    critical: "border-red-200 bg-red-50 text-red-600",
  } as const;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config[severity]}`}>
      {severity === "critical" ? "Nguy cấp" : severity === "high" ? "Cao" : severity === "medium" ? "Trung bình" : "Thấp"}
    </span>
  );
}

export default function AdminMaintenancesPage() {
  const [maintenances, setMaintenances] = useState<AdminMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "all">("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<MaintenanceIssueType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<MaintenanceSeverity | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminMaintenanceDetail | null>(null);
  const [history, setHistory] = useState<MaintenanceHistoryItem[]>([]);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [editStatus, setEditStatus] = useState<MaintenanceStatus | "">("");
  const [editSeverity, setEditSeverity] = useState<MaintenanceSeverity | "">("");
  const [editInternalNote, setEditInternalNote] = useState("");
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [editRoomUnderMaintenance, setEditRoomUnderMaintenance] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [roomThread, setRoomThread] = useState<RoomMaintenanceThreadResponse | null>(null);
  const [roomThreadLoading, setRoomThreadLoading] = useState(false);
  const [roomThreadError, setRoomThreadError] = useState("");
  const [roomThreadRoomId, setRoomThreadRoomId] = useState<string | null>(null);
  const [selectedThreadMaintenanceId, setSelectedThreadMaintenanceId] = useState<string | null>(null);
  const [threadComment, setThreadComment] = useState("");
  const [activeSectionTab, setActiveSectionTab] = useState<"requests" | "chat">("requests");
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const [threadCommentSending, setThreadCommentSending] = useState(false);
  const [lastThreadRefreshAt, setLastThreadRefreshAt] = useState("");

  const loadMaintenances = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAdminMaintenances({ status: statusFilter === "all" ? undefined : statusFilter });
      setMaintenances(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải yêu cầu bảo trì");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMaintenances();
  }, [statusFilter]);

  const loadRoomThread = async (roomId: string) => {
    setRoomThreadLoading(true);
    setRoomThreadError("");

    try {
      const data = await fetchRoomMaintenanceThread(roomId);
      setRoomThread(data);
      setSelectedThreadMaintenanceId((current) => {
        if (current && data.maintenances.some((item) => item.id === current)) return current;
        return data.maintenances[0]?.id ?? null;
      });
      setLastThreadRefreshAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      setRoomThreadError(err?.message || "Không thể tải hộp trao đổi phòng");
      setRoomThread(null);
      setSelectedThreadMaintenanceId(null);
    } finally {
      setRoomThreadLoading(false);
    }
  };

  useEffect(() => {
    if (!detailId) return;

    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError("");
      setUpdateSuccess("");
      setUploadError("");

      try {
        const [maintenance, historyItems] = await Promise.all([
          fetchAdminMaintenance(detailId),
          fetchAdminMaintenanceHistory(detailId),
        ]);

        setDetail(maintenance);
        setHistory(historyItems);
        setEditStatus(maintenance.status);
        setEditSeverity(maintenance.severity);
        setEditInternalNote(maintenance.internalNote ?? "");
        setEditRejectionReason(maintenance.rejectionReason ?? "");
        setEditRoomUnderMaintenance(maintenance.roomUnderMaintenance);
      } catch (err: any) {
        setDetailError(err?.message || "Không thể tải chi tiết");
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [detailId]);

  const roomThreadRooms = useMemo(() => {
    const map = new Map<string, { roomId: string; label: string }>();

    maintenances.forEach((item) => {
      if (!map.has(item.roomId)) {
        map.set(item.roomId, {
          roomId: item.roomId,
          label: `${item.buildingName} · ${item.roomNumber}`,
        });
      }
    });

    return Array.from(map.values());
  }, [maintenances]);

  useEffect(() => {
    if (!roomThreadRoomId && roomThreadRooms.length > 0) {
      setRoomThreadRoomId(roomThreadRooms[0].roomId);
    }
  }, [roomThreadRoomId, roomThreadRooms]);

  useEffect(() => {
    if (!roomThreadRoomId) {
      setRoomThread(null);
      setSelectedThreadMaintenanceId(null);
      return;
    }

    void loadRoomThread(roomThreadRoomId);
  }, [roomThreadRoomId]);

  useEffect(() => {
    if (!roomThreadRoomId) return;

    const connection = new HubConnectionBuilder()
      .withUrl("/hubs/maintenance")
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    connection.start().catch(() => undefined);
    connection.on("ReceiveMaintenanceUpdate", async () => {
      await loadRoomThread(roomThreadRoomId);
    });
    connection.invoke("JoinRoom", roomThreadRoomId).catch(() => undefined);

    return () => {
      connection.invoke("LeaveRoom", roomThreadRoomId).catch(() => undefined);
      connection.stop().catch(() => undefined);
    };
  }, [roomThreadRoomId]);

  const buildings = useMemo(
    () => Array.from(new Set(maintenances.map((item) => item.buildingName))).sort(),
    [maintenances],
  );

  const floors = useMemo(
    () => Array.from(new Set(maintenances.map((item) => getRoomFloor(item.roomNumber)))).sort(),
    [maintenances],
  );

  const rooms = useMemo(
    () => Array.from(new Set(maintenances.map((item) => item.roomNumber))).sort(),
    [maintenances],
  );

  const filteredMaintenances = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    return maintenances.filter((item) => {
      const matchesSearch =
        keyword.length === 0 ||
        [item.studentName, item.roomNumber, item.buildingName, item.issueType, item.description]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesBuilding = buildingFilter === "all" || item.buildingName === buildingFilter;
      const matchesFloor = floorFilter === "all" || getRoomFloor(item.roomNumber) === floorFilter;
      const matchesRoom = roomFilter === "all" || item.roomNumber === roomFilter;
      const matchesIssueType = issueTypeFilter === "all" || item.issueType === issueTypeFilter;
      const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
      const matchesDate = (() => {
        if (!fromDate && !toDate) return true;
        const submitted = new Date(item.submittedAt);
        if (fromDate && submitted < fromDate) return false;
        if (toDate && submitted > toDate) return false;
        return true;
      })();

      return matchesSearch && matchesBuilding && matchesFloor && matchesRoom && matchesIssueType && matchesSeverity && matchesDate;
    });
  }, [buildingFilter, dateFrom, floorFilter, issueTypeFilter, maintenances, roomFilter, search, severityFilter, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filteredMaintenances.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredMaintenances.length);
  const paginatedMaintenances = filteredMaintenances.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [buildingFilter, floorFilter, roomFilter, issueTypeFilter, severityFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const openDetails = (id: string) => {
    setDetailId(id);
    setDetail(null);
  };

  const closeDetails = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
    setUpdateError("");
    setUploadError("");
    setUpdateSuccess("");
  };

  const refreshActiveRoomThread = async () => {
    if (!roomThreadRoomId) return;
    await loadRoomThread(roomThreadRoomId);
  };

  const appendThreadMessage = (message: string, actorRole: string, createdAt: string) => {
    if (!selectedThreadMaintenanceId) return;

    setRoomThread((current) => {
      if (!current) return current;

      return {
        ...current,
        maintenances: current.maintenances.map((item) => {
          if (item.id !== selectedThreadMaintenanceId) return item;

          return {
            ...item,
            history: [
              ...item.history,
              {
                id: `local-${Date.now()}`,
                actorRole,
                message,
                createdAt,
              },
            ],
          };
        }),
      };
    });
  };

  const handleSave = async () => {
    if (!detailId) return;
    setUpdateError("");
    setUpdateSuccess("");

    try {
      await updateAdminMaintenance(detailId, {
        status: editStatus as MaintenanceStatus,
        severity: editSeverity as MaintenanceSeverity,
        internalNote: editInternalNote || null,
        rejectionReason: editRejectionReason || null,
        roomUnderMaintenance: editRoomUnderMaintenance,
      });

      setUpdateSuccess("Cập nhật thành công");
      await loadMaintenances();
      if (detailId) {
        const refreshed = await fetchAdminMaintenance(detailId);
        setDetail(refreshed);
      }
      await refreshActiveRoomThread();
    } catch (err: any) {
      setUpdateError(err?.message || "Cập nhật thất bại");
    }
  };

  const handleThreadCommentSend = async () => {
    if (!selectedThreadMaintenanceId || !threadComment.trim()) return;

    setThreadCommentSending(true);
    try {
      await postMaintenanceComment(selectedThreadMaintenanceId, threadComment.trim());
      appendThreadMessage(threadComment.trim(), "admin", new Date().toISOString());
      setThreadComment("");
    } catch (err: any) {
      setRoomThreadError(err?.message || "Không thể gửi bình luận");
    } finally {
      setThreadCommentSending(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      chatViewportRef.current?.scrollTo({ top: chatViewportRef.current.scrollHeight, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedThreadMaintenanceId, roomThread, threadCommentSending]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!detailId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      await uploadMaintenanceAttachment(detailId, file);
      setUploadError("");
      if (detailId) {
        const refreshed = await fetchAdminMaintenance(detailId);
        setDetail(refreshed);
      }
      await refreshActiveRoomThread();
      setUpdateSuccess("Ảnh minh chứng đã được tải lên");
    } catch (err: any) {
      setUploadError(err?.message || "Tải ảnh thất bại");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Quản lý yêu cầu sửa chữa / bảo trì</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem, phân loại và cập nhật tiến trình xử lý yêu cầu từ sinh viên.</p>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên sinh viên, phòng, loại sự cố..."
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as MaintenanceStatus | "all")}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {maintenanceStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={buildingFilter}
            onChange={(event) => setBuildingFilter(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">Tất cả tòa nhà</option>
            {buildings.map((building) => (
              <option key={building} value={building}>
                {building}
              </option>
            ))}
          </select>
          <select
            value={floorFilter}
            onChange={(event) => setFloorFilter(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">Tất cả tầng</option>
            {floors.map((floor) => (
              <option key={floor} value={floor}>
                {floor}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <select
            value={roomFilter}
            onChange={(event) => setRoomFilter(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">Tất cả phòng</option>
            {rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
          <select
            value={issueTypeFilter}
            onChange={(event) => setIssueTypeFilter(event.target.value as MaintenanceIssueType | "all")}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">Tất cả loại sự cố</option>
            {maintenanceIssueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as MaintenanceSeverity | "all")}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">Tất cả mức độ</option>
            {maintenanceSeverityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="min-w-0">
        <div className="mb-4 flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveSectionTab("requests")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeSectionTab === "requests" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-slate-100"}`}
          >
            Danh sách yêu cầu
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab("chat")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeSectionTab === "chat" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-slate-100"}`}
          >
            Chat phòng
          </button>
        </div>

        {activeSectionTab === "chat" ? (
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Hộp trao đổi theo phòng</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Giao diện giống Messenger, cập nhật realtime ngay khi có tin nhắn mới.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
                <select
                  value={roomThreadRoomId ?? ""}
                  onChange={(event) => setRoomThreadRoomId(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {roomThreadRooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {roomThreadLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Đang tải hộp trao đổi phòng...</div>
            ) : roomThreadError ? (
              <div className="p-6 text-sm text-red-600">{roomThreadError}</div>
            ) : roomThread ? (
              <div className="flex flex-col lg:flex-row">
                <aside className="w-full border-b border-slate-200 bg-white lg:w-[320px] lg:border-b-0 lg:border-r">
                  <div className="border-b border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Danh sách yêu cầu</p>
                      <span className="text-[11px] text-slate-400">{lastThreadRefreshAt ? `Cập nhật ${lastThreadRefreshAt}` : "Đang chờ"}</span>
                    </div>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto p-2">
                    {roomThread.maintenances.map((item) => {
                      const isActive = selectedThreadMaintenanceId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedThreadMaintenanceId(item.id)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${isActive ? "border-primary bg-primary/10 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {item.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{item.studentName}</p>
                              <span className="text-[11px] text-slate-400">{formatDate(item.submittedAt)}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{item.issueType.replace(/_/g, " ")}</p>
                            <p className="mt-1 truncate text-xs text-slate-400">{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="flex-1 bg-gradient-to-b from-slate-50 to-white">
                  {selectedThreadMaintenanceId ? (() => {
                    const selectedMaintenance = roomThread.maintenances.find((item) => item.id === selectedThreadMaintenanceId);
                    if (!selectedMaintenance) return null;

                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{selectedMaintenance.studentName}</p>
                            <p className="text-xs text-slate-500">{roomThread.buildingName} · {roomThread.roomNumber} · {selectedMaintenance.issueType.replace(/_/g, " ")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{selectedMaintenance.status}</span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">Realtime</span>
                          </div>
                        </div>

                        <div ref={chatViewportRef} className="flex h-[360px] flex-col gap-3 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_40%)] p-4">
                          {selectedMaintenance.history.length > 0 ? (
                            selectedMaintenance.history.map((item) => {
                              const isAdmin = item.actorRole === "admin";
                              return (
                                <div key={item.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                                  <div
                                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm shadow-sm transition-all duration-200 ${isAdmin ? "border border-slate-200 bg-white text-slate-700" : "bg-primary text-white"}`}
                                  style={{ animation: "fadeIn 180ms ease-out" }}
                                >
                                    <div className="mb-1 flex items-center gap-2 text-[11px] opacity-80">
                                      <Clock3 size={11} />
                                      {formatDate(item.createdAt)}
                                    </div>
                                    <p className="whitespace-pre-line leading-6">{item.message}</p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-center text-sm text-slate-500">
                              Chưa có trao đổi nào cho yêu cầu này.
                            </div>
                          )}

                          {selectedMaintenance.attachments.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ảnh đính kèm</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {selectedMaintenance.attachments.map((attachment) => (
                                  <a key={attachment.id} href={attachment.storagePath} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-200">
                                    <img src={attachment.storagePath} alt={attachment.fileName} className="h-28 w-full object-cover" />
                                    <p className="truncate px-2 py-1 text-xs text-slate-600">{attachment.fileName}</p>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-200 bg-white p-3">
                          <textarea
                            value={threadComment}
                            onChange={(event) => setThreadComment(event.target.value)}
                            rows={3}
                            placeholder="Nhập phản hồi như trên Messenger..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-foreground transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleThreadCommentSend();
                              }
                            }}
                          />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">Tin nhắn sẽ hiện ngay khi được gửi và cập nhật realtime.</p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleThreadCommentSend();
                              }}
                              disabled={threadCommentSending || !threadComment.trim()}
                              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Send size={15} /> Gửi
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                      Chọn một yêu cầu bên trái để xem hội thoại.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">Chưa có yêu cầu bảo trì nào cho phòng này.</div>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Sinh viên</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Sự cố</th>
                  <th className="px-4 py-3 font-medium">Mức độ</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ngày gửi</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedMaintenances.map((maintenance) => (
                  <tr key={maintenance.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => openDetails(maintenance.id)}>
                    <td className="px-4 py-3 font-medium text-foreground">{maintenance.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{maintenance.buildingName} · {maintenance.roomNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{maintenance.issueType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={maintenance.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={maintenance.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(maintenance.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetails(maintenance.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                          <Eye size={13} /> Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

            <div className="space-y-3 md:hidden">
              {paginatedMaintenances.map((maintenance) => {
                const { dot } = maintenanceStatusConfig[maintenance.status];
                return (
                  <article key={maintenance.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dot}`} />
                          <p className="truncate text-sm font-semibold text-foreground">{maintenance.studentName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{maintenance.buildingName} · {maintenance.roomNumber}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(maintenance.submittedAt)}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <span>Loại: {maintenance.issueType.replace(/_/g, " ")}</span>
                      <span>Mức độ: {maintenance.severity}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <button onClick={() => openDetails(maintenance.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">Xem</button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredMaintenances.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center text-muted-foreground">
                <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Không tìm thấy yêu cầu phù hợp.</p>
              </div>
            )}

            <AdminPagination
              page={currentPage}
              pageCount={pageCount}
              total={filteredMaintenances.length}
              start={pageStartIndex + 1}
              end={pageEndIndex}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {detailId && (
        <AdminModal
          title="Chi tiết yêu cầu bảo trì"
          description={detail ? `${detail.studentName} · ${detail.buildingName} - ${detail.roomNumber}` : undefined}
          onClose={closeDetails}
        >
          {detailLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Đang tải chi tiết...</div>
          ) : detailError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{detailError}</div>
          ) : detail ? (
            <div className="space-y-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sinh viên</p>
                  <p className="mt-2 font-medium text-foreground">{detail.studentName}</p>
                  <p className="text-xs text-muted-foreground">MSSV: {detail.studentId}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phòng</p>
                  <p className="mt-2 font-medium text-foreground">{detail.buildingName} · {detail.roomNumber}</p>
                  <p className="text-xs text-muted-foreground">Ngày gửi: {formatDate(detail.submittedAt)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                  <div className="mt-2"><StatusBadge status={detail.status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mức độ</p>
                  <div className="mt-2"><SeverityBadge severity={detail.severity} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phòng bảo trì</p>
                  <div className="mt-2">{detail.roomUnderMaintenance ? "Có" : "Không"}</div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loại sự cố</p>
                <p className="mt-2 text-foreground">{detail.issueType.replace(/_/g, " ")}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mô tả</p>
                <p className="mt-2 leading-6 text-foreground">{detail.description}</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ảnh minh chứng</p>
                {detail.attachments && detail.attachments.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {detail.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.storagePath}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-2xl border border-border bg-white p-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <FileImage size={18} />
                          <span>{attachment.fileName}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Chưa có ảnh minh chứng.</p>
                )}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted-foreground" htmlFor="maintenance-attachment">
                    Tải ảnh mới
                  </label>
                  <input
                    id="maintenance-attachment"
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="mt-2 text-sm text-foreground"
                    disabled={uploading}
                  />
                  {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Box chat theo phòng</p>
                  {roomThread && (
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-muted-foreground">
                      {roomThread.roomStatus === "maintenance" ? "Đang bảo trì" : roomThread.roomStatus === "available" ? "Có thể ở" : roomThread.roomStatus === "full" ? "Đầy" : roomThread.roomStatus}
                    </span>
                  )}
                </div>

                {roomThreadLoading ? (
                  <p className="mt-3 text-sm text-muted-foreground">Đang tải hộp trao đổi phòng...</p>
                ) : roomThreadError ? (
                  <p className="mt-3 text-sm text-red-600">{roomThreadError}</p>
                ) : roomThread ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {roomThread.maintenances.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedThreadMaintenanceId(item.id)}
                          className={`rounded-full border px-2.5 py-1 text-xs ${selectedThreadMaintenanceId === item.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted-foreground"}`}
                        >
                          {item.issueType.replace(/_/g, " ")} · {item.status}
                        </button>
                      ))}
                    </div>

                    {selectedThreadMaintenanceId ? (
                      (() => {
                        const selectedMaintenance = roomThread.maintenances.find((item) => item.id === selectedThreadMaintenanceId);
                        if (!selectedMaintenance) return null;

                        return (
                          <div className="rounded-2xl border border-border bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{selectedMaintenance.studentName}</p>
                                <p className="text-xs text-muted-foreground">{selectedMaintenance.description}</p>
                              </div>
                              <span className="text-[11px] text-muted-foreground">{selectedMaintenance.status}</span>
                            </div>

                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
                              {selectedMaintenance.history.length > 0 ? (
                                selectedMaintenance.history.map((item) => (
                                  <div key={item.id} className="rounded-xl border border-border bg-white p-2.5 text-sm">
                                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                      <span>{item.actorRole}</span>
                                      <span>{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="text-foreground">{item.message}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Chưa có trao đổi cho yêu cầu này.</p>
                              )}
                            </div>

                            {selectedMaintenance.attachments.length > 0 && (
                              <div className="mt-3">
                                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tệp đính kèm</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedMaintenance.attachments.map((attachment) => (
                                    <a key={attachment.id} href={attachment.storagePath} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground">
                                      {attachment.fileName}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 space-y-2">
                              <textarea
                                value={threadComment}
                                onChange={(event) => setThreadComment(event.target.value)}
                                rows={3}
                                placeholder="Nhập ghi chú cho admin hoặc theo dõi yêu cầu phòng này..."
                                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                              />
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">Thông tin sẽ được lưu vào nhật ký bảo trì của yêu cầu này.</p>
                                <button
                                  type="button"
                                  onClick={handleThreadCommentSend}
                                  disabled={threadCommentSending || !threadComment.trim()}
                                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {threadCommentSending ? "Đang gửi..." : "Gửi bình luận"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Chưa có yêu cầu bảo trì nào cho phòng này.</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lịch sử xử lý</p>
                {history.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border bg-white p-3 text-sm">
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>{item.actorRole}</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-foreground">{item.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Chưa có hoạt động xử lý.</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="admin-status">
                      Trạng thái xử lý
                    </label>
                    <select
                      id="admin-status"
                      value={editStatus}
                      onChange={(event) => setEditStatus(event.target.value as MaintenanceStatus)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      {maintenanceStatusOptions
                        .filter((option) => option.value !== "all")
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="admin-severity">
                      Mức độ
                    </label>
                    <select
                      id="admin-severity"
                      value={editSeverity}
                      onChange={(event) => setEditSeverity(event.target.value as MaintenanceSeverity)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      {maintenanceSeverityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={editRoomUnderMaintenance}
                      onChange={(event) => setEditRoomUnderMaintenance(event.target.checked)}
                      className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
                    />
                    Đặt phòng sang trạng thái bảo trì
                  </label>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="admin-note">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    id="admin-note"
                    value={editInternalNote}
                    onChange={(event) => setEditInternalNote(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="rejection-reason">
                    Lý do từ chối
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={editRejectionReason}
                    onChange={(event) => setEditRejectionReason(event.target.value)}
                    rows={3}
                    placeholder="Chỉ cần khi chọn trạng thái Đã từ chối"
                    className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                {updateError && <p className="mt-3 text-sm font-medium text-red-600">{updateError}</p>}
                {updateSuccess && <p className="mt-3 text-sm font-medium text-green-600">{updateSuccess}</p>}

                <button
                  onClick={handleSave}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : null}
        </AdminModal>
      )}
    </div>
  );
}

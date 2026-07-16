import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
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
  const [threadCommentSending, setThreadCommentSending] = useState(false);
  const [lastThreadRefreshAt, setLastThreadRefreshAt] = useState("");
  const [activeSectionTab, setActiveSectionTab] = useState<"requests" | "chat">("requests");
  const [chatRoomSearch, setChatRoomSearch] = useState("");
  const chatViewportRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!detailId) return;

    const connection = new HubConnectionBuilder()
      .withUrl("/hubs/maintenance")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinTicketRoom", detailId);
      } catch (err) {
        console.error("SignalR connection error (admin): ", err);
      }
    };

    void startConnection();

    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinTicketRoom", detailId);
      } catch (err) {
        console.error("SignalR ticket rejoin error (admin): ", err);
      }
    });

    connection.on("ReceiveHistoryItem", (item: any) => {
      setHistory((prev) => {
        if (prev.some((p) => p.id === item.id)) return prev;
        return [...prev, item];
      });
    });

    connection.on("ReceiveAttachment", (item: any) => {
      setHistory((prev) => {
        if (prev.some((p) => p.id === item.id)) return prev;
        return [...prev, item];
      });
      setDetail((prevDetail) => {
        if (!prevDetail || prevDetail.id !== detailId) return prevDetail;
        const currentAttachments = prevDetail.attachments || [];
        if (currentAttachments.some((a) => a.id === item.id)) return prevDetail;
        return {
          ...prevDetail,
          attachments: [
            ...currentAttachments,
            {
              id: item.id,
              fileName: item.message.replace("Gửi tệp đính kèm: ", ""),
              storagePath: item.imageUrl,
              createdAt: item.createdAt,
            }
          ]
        };
      });
    });

    connection.on("ReceiveStatusUpdate", (update: { id: string; status: any }) => {
      if (update.id !== detailId) return;
      setDetail((prevDetail) => {
        if (!prevDetail) return prevDetail;
        return { ...prevDetail, status: update.status as MaintenanceStatus };
      });
      setEditStatus(update.status as MaintenanceStatus);
      setMaintenances((prevList) =>
        prevList.map((m) => (m.id === update.id ? { ...m, status: update.status as MaintenanceStatus } : m))
      );
    });

    return () => {
      const stopConnection = async () => {
        try {
          if (connection.state === HubConnectionState.Connected) {
            await connection.invoke("LeaveTicketRoom", detailId);
            await connection.stop();
          }
        } catch (err) {
          console.error("SignalR stop error (admin): ", err);
        }
      };
      void stopConnection();
    };
  }, [detailId]);

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
    } catch (err: any) {
      setUpdateError(err?.message || "Cập nhật thất bại");
    }
  };

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
      setUpdateSuccess("Ảnh minh chứng đã được tải lên");
    } catch (err: any) {
      setUploadError(err?.message || "Tải ảnh thất bại");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Chat feature handlers
  const loadRoomThread = async (roomId: string, silent = false) => {
    if (!silent) {
      setRoomThreadLoading(true);
      setRoomThreadError("");
    }

    try {
      const data = await fetchRoomMaintenanceThread(roomId);
      setRoomThread(data);
      setSelectedThreadMaintenanceId((current) => {
        if (current && data.maintenances.some((item) => item.id === current)) return current;
        return data.maintenances[0]?.id ?? null;
      });
      setLastThreadRefreshAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      if (!silent) {
        setRoomThreadError(err?.message || "Không thể tải hộp trao đổi phòng");
        setRoomThread(null);
        setSelectedThreadMaintenanceId(null);
      }
    } finally {
      if (!silent) {
        setRoomThreadLoading(false);
      }
    }
  };

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

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinRoom", roomThreadRoomId);
      } catch (err) {
        console.error("SignalR connection error (room thread): ", err);
      }
    };

    void startConnection();

    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinRoom", roomThreadRoomId);
      } catch (err) {
        console.error("SignalR room rejoin error (admin): ", err);
      }
    });

    connection.on("ReceiveMaintenanceUpdate", async () => {
      await loadRoomThread(roomThreadRoomId, true);
    });

    return () => {
      const stopConnection = async () => {
        try {
          if (connection.state === HubConnectionState.Connected) {
            await connection.invoke("LeaveRoom", roomThreadRoomId);
            await connection.stop();
          }
        } catch (err) {
          console.error("SignalR stop error (room thread): ", err);
        }
      };
      void stopConnection();
    };
  }, [roomThreadRoomId]);

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      chatViewportRef.current?.scrollTo({ top: chatViewportRef.current.scrollHeight, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedThreadMaintenanceId, roomThread, threadCommentSending]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Quản lý yêu cầu sửa chữa / bảo trì</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem, phân loại và cập nhật tiến trình xử lý yêu cầu từ sinh viên.</p>
      </div>

      <div className="mb-5 flex gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setActiveSectionTab("requests")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${activeSectionTab === "requests" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Wrench size={14} className="mr-2 inline" /> Danh sách yêu cầu
        </button>
        <button
          type="button"
          onClick={() => setActiveSectionTab("chat")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${activeSectionTab === "chat" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare size={14} className="mr-2 inline" /> Chat phòng
        </button>
      </div>

      {activeSectionTab === "chat" ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
              <select
                value={roomThreadRoomId ?? ""}
                onChange={(event) => setRoomThreadRoomId(event.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {roomThreadRooms.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.label}
                  </option>
                ))}
              </select>
              {lastThreadRefreshAt && <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Clock3 size={12} /> Cập nhật lúc {lastThreadRefreshAt}</span>}
            </div>
          </div>

          {roomThreadLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>
          ) : roomThreadError ? (
            <div className="p-4 text-sm text-red-600">{roomThreadError}</div>
          ) : roomThread ? (
            <div className="flex h-[600px] overflow-hidden">
              {/* Left Sidebar: Request List with Search */}
              <div className="w-[280px] border-r border-border overflow-y-auto bg-muted/20">
                <div className="sticky top-0 bg-white border-b border-border p-3 z-10">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={chatRoomSearch}
                      onChange={(event) => setChatRoomSearch(event.target.value)}
                      placeholder="Tìm kiếm..."
                      className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-2 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
                    />
                  </div>
                </div>
                <div className="space-y-1 p-2">
                  {roomThread.maintenances
                    .filter((m) =>
                      chatRoomSearch
                        ? `${m.studentName} ${m.issueType}`.toLowerCase().includes(chatRoomSearch.toLowerCase())
                        : true
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedThreadMaintenanceId(m.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 text-xs transition ${
                          selectedThreadMaintenanceId === m.id
                            ? "border-ring bg-primary/10 text-foreground"
                            : "border-border bg-white text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <p className="font-medium text-foreground truncate">{m.studentName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.issueType.replace(/_/g, " ")}</p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Center: Chat Messages */}
              <div className="flex-1 flex flex-col">
                {selectedThreadMaintenanceId && roomThread.maintenances.find((m) => m.id === selectedThreadMaintenanceId) ? (
                  <>
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      {(() => {
                        const maintenance = roomThread.maintenances.find((m) => m.id === selectedThreadMaintenanceId);
                        return maintenance ? (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">{maintenance.studentName}</p>
                              <p className="text-xs text-muted-foreground">{maintenance.issueType.replace(/_/g, " ")}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                              {roomThread.roomStatus || "Active"}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    <div ref={chatViewportRef} className="flex-1 overflow-y-auto space-y-3 p-4">
                      {(() => {
                        const maintenance = roomThread.maintenances.find((m) => m.id === selectedThreadMaintenanceId);
                        return maintenance?.history && maintenance.history.length > 0 ? (
                          maintenance.history.map((item) => (
                            <div
                              key={item.id}
                              className={`flex ${item.actorRole === "admin" ? "justify-start" : "justify-end"}`}
                              style={{ animation: "fadeIn 180ms ease-out" }}
                            >
                              <div
                                className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-sm ${
                                  item.actorRole === "admin"
                                    ? "border border-border bg-white text-foreground"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                <p className="text-xs font-medium opacity-70 mb-1">{item.actorRole === "admin" ? "Admin" : "Sinh viên"}</p>
                                <p className="break-words">{item.message}</p>
                                <p className="text-xs opacity-50 mt-1">{new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">Chưa có cuộc trò chuyện.</div>
                        );
                      })()}
                    </div>

                    <div className="border-t border-border bg-white p-3">
                      <div className="flex items-end gap-2">
                        <textarea
                          value={threadComment}
                          onChange={(event) => setThreadComment(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void handleThreadCommentSend();
                            }
                          }}
                          placeholder="Nhập tin nhắn..."
                          rows={1}
                          className="flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleThreadCommentSend();
                          }}
                          disabled={threadCommentSending || !threadComment.trim()}
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground transition disabled:opacity-50 hover:opacity-90"
                          title="Gửi (Enter)"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">Chọn yêu cầu từ danh sách</div>
                )}
              </div>

              {/* Right Sidebar: Attachments */}
              <div className="w-[260px] border-l border-border overflow-y-auto bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Ảnh đính kèm</p>
                {(() => {
                  const maintenance = roomThread.maintenances.find((m) => m.id === selectedThreadMaintenanceId);
                  return maintenance && maintenance.attachments && maintenance.attachments.length > 0 ? (
                    <div className="grid gap-2">
                      {maintenance.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.storagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-lg border border-border bg-white transition hover:shadow-md hover:border-ring"
                        >
                          <div className="aspect-square bg-muted flex items-center justify-center">
                            <img src={attachment.storagePath} alt={attachment.fileName} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[11px] text-muted-foreground p-2 truncate">{attachment.fileName}</p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Chưa có ảnh</p>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
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

      {activeSectionTab === "requests" && (
      <section className="min-w-0">
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
      </section>
      )}
        </>
      )}

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

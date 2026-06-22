import { useEffect, useMemo, useState } from "react";
import { BedDouble, Building2, CheckCircle2, Hammer, Plus, Search, Users, Wrench } from "lucide-react";
import AdminModal from "./AdminModal";
import AdminPagination from "./AdminPagination";
import {
  type AdminRoom,
  type RoomStatus,
  emptyBeds,
  formatCurrency,
  initialRooms,
  nextActiveStatus,
  roomStatusConfig,
  roomStatusOptions,
  roomTypeLabel,
} from "./adminRoomsData";

const PAGE_SIZE = 5;

function StatusBadge({ status }: { status: RoomStatus }) {
  const { label, icon: Icon, className } = roomStatusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addRoomMessage, setAddRoomMessage] = useState(false);

  const buildings = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.buildingName))).sort(),
    [rooms],
  );

  const stats = useMemo(
    () => ({
      total: rooms.length,
      available: rooms.filter((room) => room.status === "available").length,
      full: rooms.filter((room) => room.status === "full").length,
      maintenance: rooms.filter((room) => room.status === "maintenance").length,
      emptyBeds: rooms.reduce((sum, room) => sum + emptyBeds(room), 0),
    }),
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        keyword.length === 0 ||
        [room.id, room.buildingName, room.roomNumber, room.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesStatus = statusFilter === "all" || room.status === statusFilter;
      const matchesBuilding = buildingFilter === "all" || room.buildingName === buildingFilter;

      return matchesSearch && matchesStatus && matchesBuilding;
    });
  }, [buildingFilter, rooms, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredRooms.length);
  const paginatedRooms = filteredRooms.slice(pageStartIndex, pageEndIndex);
  const detailRoom = rooms.find((room) => room.id === detailId) ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [buildingFilter, search, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const openDetails = (id: string) => {
    setDetailId(id);
    setAddRoomMessage(false);
  };

  const updateRoomStatus = (room: AdminRoom, status: RoomStatus) => {
    setRooms((current) => current.map((item) => (item.id === room.id ? { ...item, status } : item)));
  };

  const handleSendToMaintenance = (room: AdminRoom) => {
    if (room.status !== "available" && room.status !== "full") return;
    updateRoomStatus(room, "maintenance");
  };

  const handleReactivate = (room: AdminRoom) => {
    if (room.status !== "maintenance" && room.status !== "inactive") return;
    updateRoomStatus(room, nextActiveStatus(room));
  };

  const statItems = [
    { label: "Tổng phòng", value: stats.total, icon: Building2 },
    { label: "Còn chỗ", value: stats.available, icon: CheckCircle2 },
    { label: "Đã đầy", value: stats.full, icon: Users },
    { label: "Đang bảo trì", value: stats.maintenance, icon: Wrench },
    { label: "Chỗ trống", value: stats.emptyBeds, icon: BedDouble },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Quản lý phòng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi sức chứa, trạng thái và tình hình sử dụng phòng.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            onClick={() => setAddRoomMessage(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus size={15} />
            Thêm phòng
          </button>
          {addRoomMessage && <p className="max-w-xs text-xs text-muted-foreground">Chức năng thêm phòng sẽ được nối API ở phase sau.</p>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon size={17} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tòa nhà, số phòng hoặc mô tả..."
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as RoomStatus | "all")}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {roomStatusOptions.map((option) => (
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
        </div>
      </div>

      <section className="min-w-0">
        <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tòa nhà</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Tầng</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Sức chứa</th>
                  <th className="px-4 py-3 font-medium">Đang ở</th>
                  <th className="px-4 py-3 font-medium">Còn trống</th>
                  <th className="px-4 py-3 font-medium">Giá/tháng</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRooms.map((room) => (
                  <tr key={room.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => openDetails(room.id)}>
                    <td className="px-4 py-3 font-medium text-foreground">{room.buildingName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{room.floor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{roomTypeLabel(room.roomType)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{room.capacity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{room.currentOccupancy}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{emptyBeds(room)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatCurrency(room.pricePerMonth)}</td>
                    <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetails(room.id);
                          }}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                          Xem
                        </button>
                        {(room.status === "available" || room.status === "full") && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSendToMaintenance(room);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                          >
                            <Hammer size={13} />
                            Bảo trì
                          </button>
                        )}
                        {(room.status === "maintenance" || room.status === "inactive") && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReactivate(room);
                            }}
                            className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                          >
                            Mở lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {paginatedRooms.map((room) => {
            const { dot } = roomStatusConfig[room.status];
            return (
              <article key={room.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      <p className="truncate text-sm font-semibold text-foreground">{room.buildingName} · Phòng {room.roomNumber}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Tầng {room.floor} · {roomTypeLabel(room.roomType)}</p>
                  </div>
                  <StatusBadge status={room.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Đang ở: {room.currentOccupancy}/{room.capacity}</span>
                  <span>Còn trống: {emptyBeds(room)}</span>
                  <span className="col-span-2 font-medium text-foreground">{formatCurrency(room.pricePerMonth)}/tháng</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <button onClick={() => openDetails(room.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">Xem</button>
                  {(room.status === "available" || room.status === "full") && (
                    <button onClick={() => handleSendToMaintenance(room)} className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">Bảo trì</button>
                  )}
                  {(room.status === "maintenance" || room.status === "inactive") && (
                    <button onClick={() => handleReactivate(room)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Mở lại</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center text-muted-foreground">
            <BedDouble size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không tìm thấy phòng phù hợp.</p>
          </div>
        )}

        <AdminPagination
          page={currentPage}
          pageCount={pageCount}
          total={filteredRooms.length}
          start={pageStartIndex + 1}
          end={pageEndIndex}
          onPageChange={setCurrentPage}
        />
      </section>

      {detailRoom && (
        <AdminModal
          title={`${detailRoom.buildingName} · Phòng ${detailRoom.roomNumber}`}
          description={`Tầng ${detailRoom.floor} · ${roomTypeLabel(detailRoom.roomType)}`}
          onClose={() => setDetailId(null)}
        >
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={detailRoom.status} />
              <span className="text-xs text-muted-foreground">{formatCurrency(detailRoom.pricePerMonth)}/tháng</span>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
              <div><p className="text-xs text-muted-foreground">Sức chứa</p><p className="font-medium text-foreground">{detailRoom.capacity}</p></div>
              <div><p className="text-xs text-muted-foreground">Đang ở</p><p className="font-medium text-foreground">{detailRoom.currentOccupancy}</p></div>
              <div><p className="text-xs text-muted-foreground">Còn trống</p><p className="font-medium text-foreground">{emptyBeds(detailRoom)}</p></div>
              <div><p className="text-xs text-muted-foreground">Đơn chờ</p><p className="font-medium text-foreground">{detailRoom.pendingApplications}</p></div>
            </div>

            {detailRoom.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mô tả</p>
                <p className="mt-1 leading-6 text-foreground">{detailRoom.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sinh viên đang ở</p>
              {detailRoom.currentStudents.length > 0 ? (
                <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {detailRoom.currentStudents.map((student) => (
                    <div key={student.id} className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Chưa có sinh viên đang ở phòng này.</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {(detailRoom.status === "available" || detailRoom.status === "full") && (
                <button onClick={() => handleSendToMaintenance(detailRoom)} className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50">Đưa vào bảo trì</button>
              )}
              {(detailRoom.status === "maintenance" || detailRoom.status === "inactive") && (
                <button onClick={() => handleReactivate(detailRoom)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Mở lại phòng</button>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

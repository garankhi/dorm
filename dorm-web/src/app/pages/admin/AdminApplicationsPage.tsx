import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Clock, Eye, Search, XCircle } from "lucide-react";
import AdminModal from "./AdminModal";
import AdminPagination from "./AdminPagination";
import {
  type ApplicationStatus,
  applicationStatusConfig,
  applicationStatusOptions,
} from "./adminApplicationsData";
import { AdminApplication, approveApplication, fetchAdminApplication, rejectApplication } from "./adminApplicationApi";
import { formatDate } from "../../libs/format";

const PAGE_SIZE = 5;

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, icon: Icon, className } = applicationStatusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAdminApplication({
        page: currentPage,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        building: buildingFilter,
        q: search
      });

      setApplications(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách đơn");
    } finally {
      setLoading(false);
    }
  }

  const buildings = useMemo(
    () => Array.from(new Set(applications.map((application) => application.building))).sort(),
    [applications],
  );

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((application) => application.status === "pending").length,
      approved: applications.filter((application) => application.status === "approved").length,
      rejected: applications.filter((application) => application.status === "rejected").length,
    }),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        keyword.length === 0 ||
        [
          application.id,
          application.studentName,
          application.studentCode,
          application.email,
          application.room,
          application.building,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const matchesBuilding = buildingFilter === "all" || application.building === buildingFilter;

      return matchesSearch && matchesStatus && matchesBuilding;
    });
  }, [applications, buildingFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStartIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEndIndex = Math.min(currentPage * PAGE_SIZE, total);
  const paginatedApplications = filteredApplications;
  const detailApplication = applications.find((application) => application.id === detailId) ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [buildingFilter, search, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  useEffect(() => {
    loadApplications();
  }, [currentPage, statusFilter, search, buildingFilter]);

  const openDetails = (id: string) => {
    setDetailId(id);
    setReviewNote("");
    setReviewError("");
  };

  const closeDetails = () => {
    setDetailId(null);
    setReviewNote("");
    setReviewError("");
  };

  const handleApprove = async (application: AdminApplication) => {
    if (application.status !== "pending") return;

    setError("");
    setReviewError("");

    try {
      await approveApplication(application.id, reviewNote);
      closeDetails();
      await loadApplications();
    } catch (err: any) {
      const message = err?.message || "Chấp nhận đơn thất bại";
      if (detailId === application.id) setReviewError(message);
      else setError(message);
    }
  };

  const handleReject = async (application: AdminApplication) => {
    if (application.status !== "pending") return;
    if (!reviewNote.trim()) {
      setReviewError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setError("");
    setReviewError("");

    try {
      await rejectApplication(application.id, reviewNote);
      closeDetails();
      await loadApplications();
    } catch (err: any) {
      setReviewError(err?.message || "Từ chối đơn thất bại");
    }
  };

  const statItems = [
    { label: "Tổng đơn", value: stats.total, icon: ClipboardList },
    { label: "Chờ duyệt", value: stats.pending, icon: Clock },
    { label: "Đã duyệt", value: stats.approved, icon: CheckCircle2 },
    { label: "Từ chối", value: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Quản lý đơn đăng ký</h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi, lọc và xử lý các đơn đăng ký ký túc xá.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              placeholder="Tìm tên, MSSV, email hoặc phòng..."
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "all")}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {applicationStatusOptions.map((option) => (
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

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-white py-10 text-center text-sm text-muted-foreground">
          Đang tải danh sách đơn...
        </div>
      )}

      <section className="min-w-0">
        <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Sinh viên</th>
                  <th className="px-4 py-3 font-medium">Phòng đăng ký</th>
                  <th className="px-4 py-3 font-medium">Ngày nộp</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => openDetails(application.id)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{application.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{application.studentName}</p>
                      <p className="text-xs text-muted-foreground">{application.studentCode} · {application.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{application.building} · Phòng {application.room}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(application.submittedAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetails(application.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                          <Eye size={13} />
                          Xem
                        </button>
                        {application.status === "pending" && (
                          <>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleApprove(application);
                              }}
                              className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetails(application.id);
                                setReviewError("Vui lòng nhập lý do từ chối.");
                              }}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Từ chối
                            </button>
                          </>
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
          {paginatedApplications.map((application) => {
            const { dot } = applicationStatusConfig[application.status];
            return (
              <article key={application.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      <p className="truncate text-sm font-semibold text-foreground">{application.studentName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{application.studentCode} · {application.id}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                  <span>{application.building} · Phòng {application.room}</span>
                  <span>Ngày nộp: {formatDate(application.submittedAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <button onClick={() => openDetails(application.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">Xem</button>
                  {application.status === "pending" && (
                    <>
                      <button onClick={() => void handleApprove(application)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Duyệt</button>
                      <button onClick={() => { openDetails(application.id); setReviewError("Vui lòng nhập lý do từ chối."); }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600">Từ chối</button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filteredApplications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center text-muted-foreground">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không tìm thấy đơn phù hợp.</p>
          </div>
        )}

        <AdminPagination
          page={currentPage}
          pageCount={pageCount}
          total={total}
          start={pageStartIndex}
          end={pageEndIndex}
          onPageChange={setCurrentPage}
        />
      </section>

      {detailApplication && (
        <AdminModal
          title={`Chi tiết đơn ${detailApplication.id}`}
          description={`${detailApplication.studentName} · ${detailApplication.studentCode}`}
          onClose={closeDetails}
        >
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={detailApplication.status} />
              <span className="text-xs text-muted-foreground">Ngày nộp: {formatDate(detailApplication.submittedAt)}</span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sinh viên</p>
              <p className="mt-1 font-medium text-foreground">{detailApplication.studentName}</p>
              <p className="text-xs text-muted-foreground">{detailApplication.email}</p>
              <p className="text-xs text-muted-foreground">{detailApplication.phoneNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
              <div><p className="text-xs text-muted-foreground">Tòa nhà</p><p className="font-medium text-foreground">{detailApplication.building}</p></div>
              <div><p className="text-xs text-muted-foreground">Phòng</p><p className="font-medium text-foreground">{detailApplication.room}</p></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do đăng ký</p>
              <p className="mt-1 leading-6 text-foreground">{detailApplication.reason}</p>
            </div>
            {detailApplication.adminNote && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú admin</p>
                <p className="mt-1 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6 text-foreground">{detailApplication.adminNote}</p>
              </div>
            )}
            {detailApplication.status === "pending" && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="review-note">Ghi chú xét duyệt</label>
                <textarea
                  id="review-note"
                  value={reviewNote}
                  onChange={(event) => { setReviewNote(event.target.value); setReviewError(""); }}
                  placeholder="Nhập ghi chú hoặc lý do từ chối..."
                  className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white p-3 text-sm text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                {reviewError && <p className="mt-2 text-xs font-medium text-red-600">{reviewError}</p>}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => handleApprove(detailApplication)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Duyệt đơn</button>
                  <button onClick={() => handleReject(detailApplication)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">Từ chối</button>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}

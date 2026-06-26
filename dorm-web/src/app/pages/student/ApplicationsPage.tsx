import { ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/dorm";

interface Application {
  id: string;
  room: string;
  submittedAt: string;
  note: string;
  status: "pending" | "approved" | "rejected";
}

const statusConfig = {
  pending: {
    label: "Đang xử lý",
    icon: Clock,
    className: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-600 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    className: "bg-red-50 text-red-500 border-red-200",
    dot: "bg-red-400",
  },
};

export default function ApplicationsPage() {

  const [applications, setApplications] = useState<Application[]>([]);

const loadApplications = async () => {
  try {
    const res = await api.get("/DormApplications");
    setApplications(res.data);
  } catch (error) {
    console.error("Error loading applications:", error);
  }
};

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Đăng ký KTX</h1>
        <p className="text-sm text-muted-foreground mt-1">Danh sách các đơn đăng ký ký túc xá của bạn.</p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Bạn chưa có đơn đăng ký nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const { label, icon: Icon, className, dot } = statusConfig[app.status];
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <p className="text-sm font-semibold text-foreground">{app.room}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Mã đơn: {app.id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${className} whitespace-nowrap shrink-0`}>
                    <Icon size={11} />
                    {label}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground border-t border-border pt-3 flex items-center justify-between">
                  <span>Ngày nộp: {app.submittedAt}</span>
                  <span className="italic">{app.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

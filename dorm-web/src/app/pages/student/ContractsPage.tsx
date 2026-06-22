import { FileText, Calendar, Download } from "lucide-react";

const contracts = [
  {
    id: "HD-2024-A204-001",
    room: "Phòng 204A — Nhà A",
    startDate: "01/09/2024",
    endDate: "31/05/2025",
    status: "active" as const,
    signedDate: "25/08/2024",
  },
  {
    id: "HD-2023-B101-008",
    room: "Phòng 101A — Nhà A",
    startDate: "01/09/2023",
    endDate: "31/05/2024",
    status: "expired" as const,
    signedDate: "22/08/2023",
  },
];

export default function ContractsPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Hợp đồng lưu trú</h1>
        <p className="text-sm text-muted-foreground mt-1">Lịch sử hợp đồng ký túc xá của bạn.</p>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Bạn chưa có hợp đồng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-2xl border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#fce8f3] flex items-center justify-center">
                    <FileText size={15} className="text-[#d946a8]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{contract.room}</p>
                    <p className="text-xs text-muted-foreground">Mã HĐ: {contract.id}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    contract.status === "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {contract.status === "active" ? "Còn hiệu lực" : "Đã hết hạn"}
                </span>
              </div>

              {/* Details */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                {[
                  { label: "Ngày bắt đầu", value: contract.startDate },
                  { label: "Ngày kết thúc", value: contract.endDate },
                  { label: "Ngày ký", value: contract.signedDate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Calendar size={10} /> {label}
                    </p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="px-5 py-3 border-t border-border">
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-70 transition-opacity">
                  <Download size={13} /> Tải xuống hợp đồng (PDF)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

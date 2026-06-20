import { Receipt, CheckCircle2, AlertCircle } from "lucide-react";

const invoices = [
  {
    id: "HD-INV-2024-009",
    description: "Tiền phòng tháng 10/2024",
    amount: 450000,
    dueDate: "10/10/2024",
    status: "paid" as const,
    paidDate: "08/10/2024",
  },
  {
    id: "HD-INV-2024-010",
    description: "Tiền phòng tháng 11/2024",
    amount: 450000,
    dueDate: "10/11/2024",
    status: "unpaid" as const,
    paidDate: null,
  },
  {
    id: "HD-INV-2024-011",
    description: "Phí điện tháng 10/2024",
    amount: 85000,
    dueDate: "15/11/2024",
    status: "unpaid" as const,
    paidDate: null,
  },
  {
    id: "HD-INV-2024-006",
    description: "Tiền phòng tháng 08/2024",
    amount: 450000,
    dueDate: "10/08/2024",
    status: "paid" as const,
    paidDate: "07/08/2024",
  },
  {
    id: "HD-INV-2024-007",
    description: "Phí dịch vụ quý 3/2024",
    amount: 120000,
    dueDate: "01/09/2024",
    status: "paid" as const,
    paidDate: "28/08/2024",
  },
];

const totalUnpaid = invoices
  .filter((i) => i.status === "unpaid")
  .reduce((sum, i) => sum + i.amount, 0);

export default function InvoicesPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Hóa đơn</h1>
        <p className="text-sm text-muted-foreground mt-1">Lịch sử thanh toán và hóa đơn còn tồn.</p>
      </div>

      {/* Summary card */}
      {totalUnpaid > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Cần thanh toán</p>
            <p className="text-xs text-amber-600">
              Tổng cộng <span className="font-semibold">{totalUnpaid.toLocaleString("vi-VN")}₫</span> chưa được thanh toán.
            </p>
          </div>
          <button className="ml-auto px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shrink-0">
            Thanh toán
          </button>
        </div>
      )}

      {/* Invoice list */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Mô tả</span>
          <span className="text-right">Số tiền</span>
          <span className="text-right">Trạng thái</span>
        </div>

        <div className="divide-y divide-border">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="px-5 py-4 grid grid-cols-[1fr_auto_auto] gap-4 items-center"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{inv.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hạn: {inv.dueDate}
                  {inv.paidDate && ` · Đã thanh toán: ${inv.paidDate}`}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground text-right whitespace-nowrap">
                {inv.amount.toLocaleString("vi-VN")}₫
              </p>
              <div className="flex justify-end">
                {inv.status === "paid" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={11} /> Đã trả
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <AlertCircle size={11} /> Chưa trả
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

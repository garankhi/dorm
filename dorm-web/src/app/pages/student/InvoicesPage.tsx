import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  Receipt,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../../api/dorm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { formatDate } from "../../libs/format";

type InvoiceStatus = "unpaid" | "pending_confirmation" | "paid" | "overdue" | "cancelled";

type StudentInvoice = {
  id: string;
  invoiceCode: string;
  paymentCode?: string | null;
  billingMonth: number;
  billingYear: number;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
};

type SepayQr = {
  invoiceId: string;
  amount: number;
  paymentCode: string;
  qrUrl: string;
};

const currency = new Intl.NumberFormat("vi-VN");

const statusConfig: Record<InvoiceStatus, { label: string; className: string; icon: typeof AlertCircle }> = {
  unpaid: {
    label: "Chưa trả",
    className: "text-amber-600 bg-amber-50",
    icon: AlertCircle,
  },
  pending_confirmation: {
    label: "Chờ xác nhận",
    className: "text-blue-600 bg-blue-50",
    icon: Loader2,
  },
  paid: {
    label: "Đã trả",
    className: "text-green-600 bg-green-50",
    icon: CheckCircle2,
  },
  overdue: {
    label: "Quá hạn",
    className: "text-red-600 bg-red-50",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Đã hủy",
    className: "text-muted-foreground bg-muted",
    icon: XCircle,
  },
};

function invoiceDescription(invoice: StudentInvoice) {
  return `Tiền phòng tháng ${invoice.billingMonth}/${invoice.billingYear}`;
}

function canPay(invoice: StudentInvoice) {
  return invoice.status === "unpaid" || invoice.status === "overdue";
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [qr, setQr] = useState<SepayQr | null>(null);
  const [paidInvoiceId, setPaidInvoiceId] = useState<string | null>(null);

  const totalUnpaid = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue")
        .reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices],
  );

  const loadInvoices = async () => {
    const res = await api.get<StudentInvoice[]>("/invoices/me");
    setInvoices(res.data);
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await api.get<StudentInvoice[]>("/invoices/me");
        if (active) setInvoices(res.data);
      } catch {
        toast.error("Không thể tải danh sách hóa đơn.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!qr) return;

    const intervalId = window.setInterval(async () => {
      try {
        const res = await api.get<StudentInvoice>(`/invoices/${qr.invoiceId}`);
        setInvoices((prev) => prev.map((invoice) => (invoice.id === res.data.id ? res.data : invoice)));

        if (res.data.status === "paid") {
          window.clearInterval(intervalId);
          setPaidInvoiceId(res.data.id);
          await loadInvoices();
          toast.success("Thanh toán thành công.");
        }
      } catch {
        // Keep the QR open; transient polling errors should not interrupt payment.
      }
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [qr]);

  const startPayment = async (invoice: StudentInvoice) => {
    if (!canPay(invoice)) return;

    setPayingId(invoice.id);
    setPaidInvoiceId(null);

    try {
      const res = await api.post<SepayQr>(`/invoices/${invoice.id}/sepay`);
      setQr(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Không thể tạo mã QR thanh toán.");
    } finally {
      setPayingId(null);
    }
  };

  const startFirstPayment = () => {
    const invoice = invoices.find(canPay);
    if (invoice) startPayment(invoice);
  };

  const copyPaymentCode = async () => {
    if (!qr?.paymentCode) return;

    await navigator.clipboard.writeText(qr.paymentCode);
    toast.success("Đã copy mã thanh toán.");
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Hóa đơn</h1>
        <p className="text-sm text-muted-foreground mt-1">Lịch sử thanh toán và hóa đơn còn tồn.</p>
      </div>

      {totalUnpaid > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Cần thanh toán</p>
            <p className="text-xs text-amber-600">
              Tổng cộng <span className="font-semibold">{currency.format(totalUnpaid)}₫</span> chưa được thanh toán.
            </p>
          </div>
          <button
            onClick={startFirstPayment}
            className="ml-auto px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shrink-0"
          >
            Thanh toán
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Mô tả</span>
          <span className="text-right">Số tiền</span>
          <span className="text-right">Trạng thái</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Receipt size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Bạn chưa có hóa đơn nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((invoice) => {
              const { icon: StatusIcon, className, label } = statusConfig[invoice.status] ?? statusConfig.unpaid;
              const isPaying = payingId === invoice.id;

              return (
                <div key={invoice.id} className="px-5 py-4 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{invoiceDescription(invoice)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mã: {invoice.invoiceCode} · Hạn: {formatDate(invoice.dueDate)}
                    </p>
                    {invoice.paymentCode && (
                      <p className="text-xs text-muted-foreground mt-0.5">Mã thanh toán: {invoice.paymentCode}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground text-right whitespace-nowrap">
                    {currency.format(invoice.amount)}₫
                  </p>
                  <div className="flex justify-end items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
                      <StatusIcon size={11} className={invoice.status === "pending_confirmation" ? "animate-spin" : ""} />
                      {label}
                    </span>
                    {canPay(invoice) && (
                      <button
                        onClick={() => startPayment(invoice)}
                        disabled={isPaying}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
                      >
                        {isPaying ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
                        Thanh toán
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!qr}
        onOpenChange={(open) => {
          if (!open) {
            setQr(null);
            setPaidInvoiceId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thanh toán bằng Sepay</DialogTitle>
            <DialogDescription>Quét mã QR và giữ nguyên nội dung chuyển khoản.</DialogDescription>
          </DialogHeader>

          {qr && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-white p-3 flex justify-center">
                <img src={qr.qrUrl} alt={`QR thanh toán ${qr.paymentCode}`} className="w-full max-w-[260px] rounded-lg" />
              </div>

              <div className="rounded-xl bg-muted px-4 py-3 text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-foreground">{currency.format(qr.amount)}₫</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Mã thanh toán</span>
                  <button onClick={copyPaymentCode} className="inline-flex items-center gap-1 font-semibold text-primary">
                    {qr.paymentCode}
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {paidInvoiceId === qr.invoiceId ? (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Thanh toán đã được xác nhận.
                </div>
              ) : (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin shrink-0" /> Hệ thống đang chờ Sepay xác nhận giao dịch.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

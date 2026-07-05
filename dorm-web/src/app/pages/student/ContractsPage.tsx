import { Calendar, Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../api/dorm";
import { getCurrentUser } from "../../auth";
import { formatDate } from "../../libs/format";

type ContractStatus = "pending_payment" | "active" | "expired" | "terminated" | "cancelled";

type StudentContract = {
  id: string;
  roomId: string;
  buildingName: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  depositAmount: number;
  status: ContractStatus;
};

const currency = new Intl.NumberFormat("vi-VN");

function contractCode(id: string) {
  return `HD-${id.slice(0, 8).toUpperCase()}`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  pending_payment: {
    label: "Chờ thanh toán",
    className: "bg-amber-50 text-amber-600",
  },
  active: {
    label: "Còn hiệu lực",
    className: "bg-green-50 text-green-600",
  },
  expired: {
    label: "Đã hết hạn",
    className: "bg-muted text-muted-foreground",
  },
  terminated: {
    label: "Đã kết thúc",
    className: "bg-red-50 text-red-600",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-slate-50 text-slate-600",
  },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<StudentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  const exportContractPdf = (contract: StudentContract) => {
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      toast.error("Trình duyệt đã chặn cửa sổ xuất PDF. Vui lòng cho phép popup cho trang này.");
      return;
    }

    if (!user) {
      printWindow.close();
      toast.error("Không tìm thấy thông tin sinh viên.");
      return;
    }

    const status = statusConfig[contract.status] ?? statusConfig.pending_payment;
    const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(contractCode(contract.id))}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: "Times New Roman", serif;
      font-size: 13px;
      line-height: 1.55;
      background: #fff;
    }
    .page { width: 100%; }
    .center { text-align: center; }
    .muted { color: #4b5563; }
    .header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 22px;
      text-align: center;
      font-size: 12px;
      text-transform: uppercase;
    }
    .title {
      margin: 24px 0 4px;
      text-align: center;
      font-size: 21px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .code {
      text-align: center;
      margin-bottom: 22px;
      font-size: 13px;
    }
    .section-title {
      margin: 18px 0 8px;
      font-weight: 700;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px;
    }
    td {
      border: 1px solid #9ca3af;
      padding: 7px 9px;
      vertical-align: top;
    }
    td.label {
      width: 32%;
      font-weight: 700;
      background: #f3f4f6;
    }
    ol {
      padding-left: 20px;
      margin: 8px 0;
    }
    li { margin-bottom: 5px; }
    .signature {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-top: 36px;
      text-align: center;
    }
    .signature strong { text-transform: uppercase; }
    .sign-space { height: 72px; }
    .footer-note {
      margin-top: 18px;
      font-size: 12px;
      color: #4b5563;
      font-style: italic;
    }
    @media print {
      .no-print { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <strong>Trường Đại học</strong><br />
        Ban quản lý ký túc xá
      </div>
      <div>
        <strong>Cộng hòa xã hội chủ nghĩa Việt Nam</strong><br />
        Độc lập - Tự do - Hạnh phúc
      </div>
    </div>

    <div class="title">Hợp đồng lưu trú ký túc xá</div>
    <div class="code">Số hợp đồng: <strong>${escapeHtml(contractCode(contract.id))}</strong></div>

    <p>Hôm nay, hợp đồng lưu trú ký túc xá được lập giữa Ban quản lý ký túc xá và sinh viên có thông tin dưới đây.</p>

    <div class="section-title">I. Thông tin sinh viên</div>
    <table>
      <tr><td class="label">Họ và tên</td><td>${escapeHtml(user.name)}</td></tr>
      <tr><td class="label">Mã sinh viên</td><td>${escapeHtml(user.studentId || "Chưa cập nhật")}</td></tr>
      <tr><td class="label">Email</td><td>${escapeHtml(user.email)}</td></tr>
      <tr><td class="label">Số điện thoại</td><td>${escapeHtml(user.phone || "Chưa cập nhật")}</td></tr>
      <tr><td class="label">Khoa/Lớp</td><td>${escapeHtml([user.faculty, user.className].filter(Boolean).join(" - ") || "Chưa cập nhật")}</td></tr>
    </table>

    <div class="section-title">II. Thông tin phòng và thời hạn lưu trú</div>
    <table>
      <tr><td class="label">Tòa nhà</td><td>${escapeHtml(contract.buildingName)}</td></tr>
      <tr><td class="label">Phòng</td><td>${escapeHtml(contract.roomNumber)}</td></tr>
      <tr><td class="label">Ngày bắt đầu</td><td>${escapeHtml(formatDate(contract.startDate))}</td></tr>
      <tr><td class="label">Ngày kết thúc</td><td>${escapeHtml(formatDate(contract.endDate))}</td></tr>
      <tr><td class="label">Phí phòng</td><td>${escapeHtml(currency.format(contract.monthlyPrice))} VND/tháng</td></tr>
      <tr><td class="label">Tiền cọc</td><td>${escapeHtml(currency.format(contract.depositAmount))} VND</td></tr>
      <tr><td class="label">Trạng thái</td><td>${escapeHtml(status.label)}</td></tr>
    </table>

    <div class="section-title">III. Điều khoản chung</div>
    <ol>
      <li>Sinh viên sử dụng phòng đúng mục đích lưu trú, tuân thủ nội quy ký túc xá và quy định của nhà trường.</li>
      <li>Sinh viên có trách nhiệm thanh toán đầy đủ các khoản phí theo hóa đơn được hệ thống phát hành.</li>
      <li>Ban quản lý ký túc xá có trách nhiệm bố trí phòng theo thông tin hợp đồng sau khi sinh viên hoàn tất thanh toán.</li>
      <li>Việc gia hạn, kết thúc hoặc hủy hợp đồng được thực hiện theo quy trình quản lý ký túc xá.</li>
    </ol>

    <div class="signature">
      <div>
        <strong>Đại diện ban quản lý</strong>
        <div class="muted">(Ký và ghi rõ họ tên)</div>
        <div class="sign-space"></div>
      </div>
      <div>
        <strong>Sinh viên</strong>
        <div class="muted">(Ký và ghi rõ họ tên)</div>
        <div class="sign-space"></div>
        <strong>${escapeHtml(user.name)}</strong>
      </div>
    </div>

    <div class="footer-note">Hợp đồng được xuất từ hệ thống quản lý ký túc xá. Các trường thông tin được lấy theo dữ liệu hiện tại của sinh viên, phòng và hợp đồng.</div>
  </div>
  <script>
    window.addEventListener("load", function () {
      window.print();
    });
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    let active = true;

    async function loadContracts() {
      try {
        const res = await api.get<StudentContract[]>("/contracts/me");
        if (active) setContracts(res.data);
      } catch {
        toast.error("Không thể tải danh sách hợp đồng.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContracts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Hợp đồng lưu trú</h1>
        <p className="text-sm text-muted-foreground mt-1">Lịch sử hợp đồng ký túc xá của bạn.</p>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-muted-foreground">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Bạn chưa có hợp đồng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const status = statusConfig[contract.status] ?? statusConfig.pending_payment;

            return (
              <div
                key={contract.id}
                className="bg-white rounded-2xl border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#fce8f3] flex items-center justify-center">
                      <FileText size={15} className="text-[#d946a8]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {contract.buildingName} - Phòng {contract.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">Mã HĐ: {contractCode(contract.id)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  {[
                    { label: "Ngày bắt đầu", value: formatDate(contract.startDate) },
                    { label: "Ngày kết thúc", value: formatDate(contract.endDate) },
                    { label: "Phí phòng", value: `${currency.format(contract.monthlyPrice)}₫/tháng` },
                    { label: "Tiền cọc", value: `${currency.format(contract.depositAmount)}₫` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Calendar size={10} /> {label}
                      </p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-border">
                  <button
                    onClick={() => exportContractPdf(contract)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-70 transition-opacity"
                  >
                    <Download size={13} /> Xuất hợp đồng PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

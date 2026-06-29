type AdminPaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
};

export default function AdminPagination({ page, pageCount, total, start, end, onPageChange }: AdminPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Hiển thị <span className="font-medium text-foreground">{start}</span>-<span className="font-medium text-foreground">{end}</span> trong <span className="font-medium text-foreground">{total}</span> kết quả
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <span className="min-w-16 text-center text-xs font-medium text-foreground">
          {page}/{pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

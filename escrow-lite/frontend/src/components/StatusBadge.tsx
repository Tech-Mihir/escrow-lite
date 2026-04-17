type Status = "Funded" | "Delivered" | "Released";

const styles: Record<Status, string> = {
  Funded: "bg-yellow-900 text-yellow-300",
  Delivered: "bg-blue-900 text-blue-300",
  Released: "bg-green-900 text-green-300",
};

const icons: Record<Status, string> = {
  Funded: "💰",
  Delivered: "📦",
  Released: "✅",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${styles[status]}`}
    >
      {icons[status]} {status}
    </span>
  );
}

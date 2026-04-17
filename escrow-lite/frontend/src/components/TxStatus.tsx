"use client";

interface TxStatusProps {
  status: "idle" | "pending" | "success" | "error";
  message?: string;
}

export default function TxStatus({ status, message }: TxStatusProps) {
  if (status === "idle") return null;

  const styles = {
    pending: "bg-yellow-900 border-yellow-700 text-yellow-200",
    success: "bg-green-900 border-green-700 text-green-200",
    error: "bg-red-900 border-red-700 text-red-200",
  };

  const icons = {
    pending: "⏳",
    success: "✅",
    error: "❌",
  };

  return (
    <div
      className={`border rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${styles[status]}`}
      role="alert"
    >
      <span>{icons[status]}</span>
      <span>{message ?? status}</span>
    </div>
  );
}

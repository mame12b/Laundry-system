export default function Toast({ type = "success", message, onClose }) {
  if (!message) return null;

  const base =
    "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow text-sm flex items-start gap-3";
  const style = type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white";

  return (
    <div className={`${base} ${style}`}>
      <div className="flex-1">{message}</div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white font-bold"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

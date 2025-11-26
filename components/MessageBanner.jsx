export default function MessageBanner({ message, isError }) {
  if (!message) return null;
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-sky-200 bg-sky-50 text-sky-800"
      }`}
      role={isError ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

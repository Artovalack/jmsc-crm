export default function Notice({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <div className={`notice ${error ? "notice-error" : "notice-success"}`} role={error ? "alert" : "status"}>
      {error || message}
    </div>
  );
}

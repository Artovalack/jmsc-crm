export default function QueryError({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <strong>Could not load this workspace data.</strong>
      <span>{message}</span>
      <small>Check your Supabase connection and row-level security policies, then refresh.</small>
    </div>
  );
}

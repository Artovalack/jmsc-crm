export default function StatusBadge({ value }: { value: string }) {
  const className = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return <span className={`status status-${className}`}>{value}</span>;
}

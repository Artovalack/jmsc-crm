import type { ReactNode } from "react";
import type { FormAction } from "@/components/record-form";

export default function StatusForm({
  action,
  id,
  status,
  options,
  label = "Update",
  extra,
}: {
  action: FormAction;
  id: string;
  status: string;
  options: string[];
  label?: string;
  extra?: ReactNode;
}) {
  return (
    <form action={action} className="status-form">
      <input type="hidden" name="id" value={id} />
      {extra}
      <select className="inline-select" name="status" defaultValue={status} aria-label={`Status: ${status}`}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <button className="button button-secondary button-small" type="submit">{label}</button>
    </form>
  );
}

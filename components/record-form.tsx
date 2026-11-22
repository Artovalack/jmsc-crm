import Link from "next/link";
import type { ReactNode } from "react";

type Option = { value: string; label: string };
export type FormField = {
  name: string;
  label: string;
  kind?: "text" | "email" | "tel" | "date" | "number" | "select" | "textarea" | "file" | "hidden";
  required?: boolean;
  value?: string | number;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  accept?: string;
  rows?: number;
  full?: boolean;
  options?: Option[];
};
export type FormAction = (formData: FormData) => void | Promise<void>;

export default function RecordForm({
  action,
  fields,
  cancelHref,
  submitLabel = "Save record",
  aside,
}: {
  action: FormAction;
  fields: FormField[];
  cancelHref: string;
  submitLabel?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="form-layout">
      <section className="panel form-card">
        <form action={action} className="form-stack">
          <div className="form-grid">
            {fields.map((field) => (
              field.kind === "hidden" ? (
                <input type="hidden" name={field.name} value={String(field.value ?? "")} key={field.name} />
              ) : (
              <label className={`field ${field.full ? "field-full" : ""}`} key={field.name}>
                <span>{field.label}{field.required ? " *" : ""}</span>
                {field.kind === "select" ? (
                  <select name={field.name} required={field.required} defaultValue={String(field.value ?? "")}>
                    {!field.required && <option value="">Not assigned</option>}
                    {field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                ) : field.kind === "textarea" ? (
                  <textarea name={field.name} required={field.required} placeholder={field.placeholder} rows={field.rows ?? 3} defaultValue={String(field.value ?? "")} />
                ) : (
                  <input
                    name={field.name}
                    type={field.kind ?? "text"}
                    required={field.required}
                    placeholder={field.placeholder}
                    defaultValue={field.kind === "file" ? undefined : field.value}
                    min={field.min}
                    max={field.max}
                    accept={field.accept}
                  />
                )}
                {field.hint && <small className="field-hint">{field.hint}</small>}
              </label>
              )
            ))}
          </div>
          <div className="form-actions">
            <Link href={cancelHref} className="button button-secondary">Cancel</Link>
            <button type="submit" className="button button-primary">{submitLabel}<span>↗</span></button>
          </div>
        </form>
      </section>
      {aside && <aside className="form-aside">{aside}</aside>}
    </div>
  );
}

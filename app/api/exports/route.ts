import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const exportTypes = ["clients", "leads", "orders", "quotations"] as const;
type ExportType = typeof exportTypes[number];

function safeCell(value: unknown) {
  let text = value == null ? "" : typeof value === "string" ? value : String(value);
  if (typeof value === "string" && /^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv<Row extends object>(rows: Row[]) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  return [
    columns.map(safeCell).join(","),
    ...rows.map((row) => columns.map((column) => safeCell(Reflect.get(row, column))).join(",")),
  ].join("\r\n");
}

function isExportType(value: string | null): value is ExportType {
  return exportTypes.some((type) => type === value);
}

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (!isExportType(type)) {
    return Response.json({ error: "Choose an export type: clients, leads, orders, or quotations." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Configure Supabase before exporting workspace data." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sign in to export workspace data." }, { status: 401 });
  const { data: profile, error: profileError } = await supabase.from("profiles").select("is_active").eq("id", user.id).maybeSingle();
  if (profileError) {
    console.error("Could not verify CSV export access.", profileError);
    return Response.json({ error: "Workspace access could not be verified." }, { status: 500 });
  }
  if (!profile?.is_active) return Response.json({ error: "An active team membership is required." }, { status: 403 });

  const result = await supabase.from(type).select("*").order("created_at", { ascending: false });
  if (result.error) {
    console.error(`Could not export ${type}.`, result.error);
    return Response.json({ error: "The requested records could not be exported." }, { status: 500 });
  }

  const csv = toCsv(result.data);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jmsc-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

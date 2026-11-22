import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { createOrder } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ error?: string; client?: string }> };

export default async function NewOrderPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const [clientsResult, catalogResult, profilesResult, leadsResult] = await Promise.all([
    supabase.from("clients").select("id,full_name,organization").order("organization"),
    supabase.from("catalog_items").select("id,name").eq("active", true).order("name"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true).order("full_name"),
    supabase.from("leads").select("id,full_name,organization").eq("status", "Won").is("converted_client_id", null),
  ]);
  const resultError = clientsResult.error || catalogResult.error || profilesResult.error || leadsResult.error;
  if (resultError) return <div className="notice notice-error">{resultError.message}</div>;
  if (!clientsResult.data.length) return <div className="empty-state"><Users size={22} /><strong>Add a client first</strong><p>Projects need a client record. You can create one from a won lead or add a client directly.</p><div className="toolbar"><Link className="button button-secondary" href="/clients/new">Add client</Link><Link className="button button-primary" href="/leads">Open leads</Link></div></div>;
  return (
    <>
      <PageHeading eyebrow="MAKE ROOM FOR GOOD WORK" title="Start a project" description="Carry the agreed scope into a clear, owned delivery plan." />
      <Notice error={params.error} />
      <RecordForm action={createOrder} cancelHref="/orders" fields={[
        { name: "title", label: "Project title", required: true, placeholder: "e.g. Campus Week — visual kit" },
        { name: "client_id", label: "Client", kind: "select", required: true, value: params.client ?? "", options: clientsResult.data.map((client) => ({ value: client.id, label: `${client.organization || client.full_name} · ${client.full_name}` })) },
        { name: "source_lead_id", label: "Won lead to convert", kind: "select", options: leadsResult.data.map((lead) => ({ value: lead.id, label: `${lead.organization || lead.full_name} · ${lead.full_name}` })) },
        { name: "catalog_item_id", label: "Service", kind: "select", options: catalogResult.data.map((item) => ({ value: item.id, label: item.name })) },
        { name: "status", label: "Starting stage", kind: "select", required: true, value: "Confirmed", options: ["Confirmed", "Briefing", "In design"].map((item) => ({ value: item, label: item })) },
        { name: "priority", label: "Priority", kind: "select", required: true, value: "Normal", options: ["Low", "Normal", "High", "Urgent"].map((item) => ({ value: item, label: item })) },
        { name: "owner_id", label: "Project owner", kind: "select", options: profilesResult.data.map((profile) => ({ value: profile.id, label: profile.full_name })) },
        { name: "due_date", label: "Target date", kind: "date" },
        { name: "brief", label: "Brief", kind: "textarea", full: true, placeholder: "Purpose, audience, required content, and any dependencies." },
        { name: "deliverables", label: "Deliverables", kind: "textarea", full: true, placeholder: "List the files, sizes, quantities, or formats the client expects." },
        { name: "internal_notes", label: "Internal notes", kind: "textarea", full: true, placeholder: "Team-only context. Do not copy this into client-facing messages." },
      ]} aside={<><span className="eyebrow">BE CLEAR ON THE HANDOFF</span><h3>Design first. Production separately.</h3><p>Confirm the scope and approval path before a file goes to a print partner. Keep external delivery dates visibly separate from JMSC design deadlines.</p></>} />
    </>
  );
}

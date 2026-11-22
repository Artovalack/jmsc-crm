import { redirect } from "next/navigation";
import { createProductionHandoff } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewHandoffPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const [{ error }, supabase] = await Promise.all([searchParams, createClient()]);
  const [ordersResult, partnersResult] = await Promise.all([
    supabase.from("orders").select("id,title").not("status", "in", "(Cancelled,Completed)").order("due_date"),
    supabase.from("partners").select("id,name").eq("active", true).order("name"),
  ]);
  if (ordersResult.error || partnersResult.error) return <div className="notice notice-error">{ordersResult.error?.message || partnersResult.error?.message}</div>;
  return (
    <>
      <PageHeading eyebrow="APPROVED FILES ONLY" title="Create print handoff" description="Record the partner, specifications, quantity, and agreed date." />
      <Notice error={error} />
      {!ordersResult.data.length || !partnersResult.data.length ? <div className="notice notice-error">Add an active project and a print partner before creating a handoff.</div> : <RecordForm action={createProductionHandoff} cancelHref="/partners" fields={[
        { name: "order_id", label: "Project", kind: "select", required: true, options: ordersResult.data.map((order) => ({ value: order.id, label: order.title })) },
        { name: "partner_id", label: "Print partner", kind: "select", required: true, options: partnersResult.data.map((partner) => ({ value: partner.id, label: partner.name })) },
        { name: "quantity", label: "Quantity", kind: "number", required: true, min: 1, value: 1 },
        { name: "promised_date", label: "Partner's expected date", kind: "date" },
        { name: "specifications", label: "Production specifications", kind: "textarea", full: true, required: true, placeholder: "Item, sizes, material, color notes, approved file/version, and delivery arrangement." },
      ]} aside={<><span className="eyebrow">HANDOFF CHECK</span><h3>Approval before production.</h3><p>Confirm the client-approved proof and production specifications. A partner&apos;s estimate is not a guaranteed delivery date for the client.</p></>} />}
    </>
  );
}

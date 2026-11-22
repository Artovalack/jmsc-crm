import { redirect } from "next/navigation";
import { createQuotation } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewQuotationPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const [{ error }, supabase] = await Promise.all([searchParams, createClient()]);
  const [clientsResult, ordersResult] = await Promise.all([
    supabase.from("clients").select("id,full_name,organization").order("organization"),
    supabase.from("orders").select("id,title").order("created_at", { ascending: false }),
  ]);
  if (clientsResult.error || ordersResult.error) return <div className="notice notice-error">{clientsResult.error?.message || ordersResult.error?.message}</div>;
  return (
    <>
      <PageHeading eyebrow="SCOPE BEFORE SPEND" title="Draft a quotation" description="Keep line-of-work assumptions and validity visible." />
      <Notice error={error} />
      <RecordForm action={createQuotation} cancelHref="/quotations" fields={[
        { name: "client_id", label: "Client", kind: "select", required: true, options: clientsResult.data.map((client) => ({ value: client.id, label: client.organization || client.full_name })) },
        { name: "order_id", label: "Related project", kind: "select", options: ordersResult.data.map((order) => ({ value: order.id, label: order.title })) },
        { name: "service_summary", label: "Scope of work", required: true, full: true, placeholder: "Describe what's included in this estimate." },
        { name: "amount_php", label: "Total (PHP)", kind: "number", required: true, min: 0 },
        { name: "valid_until", label: "Valid through", kind: "date" },
        { name: "assumptions", label: "Assumptions & exclusions", kind: "textarea", full: true, placeholder: "Revision rounds, third-party print costs, delivery assumptions, and exclusions." },
      ]} aside={<><span className="eyebrow">CLIENT RELATIONS + FINANCE</span><h3>Internal draft until approved.</h3><p>This record is not sent automatically. Review amounts, revision assumptions, taxes, and third-party production before sharing an estimate.</p></>} />
    </>
  );
}

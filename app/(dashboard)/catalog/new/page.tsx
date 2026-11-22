import { redirect } from "next/navigation";
import { createCatalogItem } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewCatalogItemPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { error } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="DEFINE THE OFFER" title="Add a service" description="Give the team a consistent way to describe the work." />
      <Notice error={error} />
      <RecordForm action={createCatalogItem} cancelHref="/catalog" fields={[
        { name: "name", label: "Service name", required: true },
        { name: "category", label: "Category", kind: "select", required: true, options: ["Brand identity", "Digital collateral", "Event materials", "Apparel & uniforms", "Print-ready layouts", "B2B production support", "Other"].map((item) => ({ value: item, label: item })) },
        { name: "is_physical", label: "Production type", kind: "select", required: true, value: "no", options: [{ value: "no", label: "Digital / studio-delivered" }, { value: "yes", label: "Physical output / print partner" }] },
        { name: "description", label: "Service description", kind: "textarea", full: true, placeholder: "What is included? What details should the team confirm?" },
      ]} aside={<><span className="eyebrow">KEEP THE PROMISE CLEAR</span><h3>Design and production are distinct.</h3><p>JMSC prepares layouts and coordinates print partners. Keep physical production dependencies visible in the service notes.</p></>} />
    </>
  );
}

import { redirect } from "next/navigation";
import { createPartner } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewPartnerPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { error } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="TRUSTED EXTERNAL MAKERS" title="Add a print partner" description="Keep capabilities and contacts ready for a good handoff." />
      <Notice error={error} />
      <RecordForm action={createPartner} cancelHref="/partners" fields={[
        { name: "name", label: "Business name", required: true },
        { name: "contact_name", label: "Primary contact" },
        { name: "email", label: "Email", kind: "email" },
        { name: "phone", label: "Phone", kind: "tel" },
        { name: "location", label: "Location" },
        { name: "capabilities", label: "Capabilities", kind: "textarea", full: true, placeholder: "e.g. sublimation jerseys, event lanyards, large-format posters" },
        { name: "notes", label: "Working notes", kind: "textarea", full: true, placeholder: "Usual lead times, preferred file specs, or quality considerations." },
      ]} aside={<><span className="eyebrow">EXTERNAL DEPENDENCY</span><h3>Track what is agreed.</h3><p>Capture dates as partner commitments, not JMSC guarantees. Record proof checks, color notes, and quality issues in the handoff.</p></>} />
    </>
  );
}

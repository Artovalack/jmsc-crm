import { redirect } from "next/navigation";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { createLead } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewLeadPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const [{ error }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: profiles, error: profileError } = await supabase.from("profiles").select("id,full_name").eq("is_active", true).order("full_name");
  if (profileError) return <div className="notice notice-error">{profileError.message}</div>;

  return (
    <>
      <PageHeading eyebrow="A NEW CONVERSATION" title="Add a lead" description="Capture the need, the owner, and a thoughtful next step." />
      <Notice error={error} />
      <RecordForm
        action={createLead}
        cancelHref="/leads"
        fields={[
          { name: "full_name", label: "Contact name", required: true },
          { name: "organization", label: "Organization" },
          { name: "email", label: "Email", kind: "email" },
          { name: "phone", label: "Phone", kind: "tel" },
          { name: "location", label: "Location", kind: "select", required: true, value: "Davao City", options: ["Davao City", "Tagum City", "Nabunturan", "Other Davao Region"].map((item) => ({ value: item, label: item })) },
          { name: "requested_service", label: "Requested service", kind: "select", required: true, options: ["Logo & brand identity", "Social media graphics", "Certificates & lanyards", "Jersey & apparel layout", "Print-ready vector layout", "Other"].map((item) => ({ value: item, label: item })) },
          { name: "source", label: "How they found JMSC", kind: "select", required: true, value: "Referral", options: ["Referral", "Facebook", "Instagram", "Walk-in", "Website", "B2B outreach", "Other"].map((item) => ({ value: item, label: item })) },
          { name: "owner_id", label: "Follow-up owner", kind: "select", options: profiles.map((profile) => ({ value: profile.id, label: profile.full_name })) },
          { name: "follow_up_on", label: "Next follow-up", kind: "date" },
          { name: "notes", label: "Conversation notes", kind: "textarea", full: true, placeholder: "What do they need? Any important context for the first reply?" },
        ]}
        aside={<><span className="eyebrow">A GOOD FIRST STEP</span><h3>Leave with a next action.</h3><p>A named owner and realistic follow-up date keep the conversation warm around everyone&apos;s class schedule.</p><ul><li>Don&apos;t promise a print date yet</li><li>Confirm what “done” means</li><li>Record only useful context</li></ul></>}
      />
    </>
  );
}

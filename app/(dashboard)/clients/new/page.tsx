import Link from "next/link";
import { redirect } from "next/navigation";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import RecordForm from "@/components/record-form";
import { createClientRecord } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewClientPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { error } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="A NEW RELATIONSHIP" title="Add a client" description="Capture the essentials. Keep the conversation human." />
      <Notice error={error} />
      <RecordForm
        action={createClientRecord}
        cancelHref="/clients"
        fields={[
          { name: "full_name", label: "Contact name", required: true },
          { name: "organization", label: "Organization" },
          { name: "email", label: "Email", kind: "email" },
          { name: "phone", label: "Phone", kind: "tel" },
          { name: "location", label: "Location", kind: "select", required: true, value: "Davao City", options: ["Davao City", "Tagum City", "Nabunturan", "Other Davao Region"].map((item) => ({ value: item, label: item })) },
          { name: "preferred_contact", label: "Preferred contact", kind: "select", required: true, value: "Messenger", options: ["Messenger", "Email", "Phone", "Other"].map((item) => ({ value: item, label: item })) },
          { name: "notes", label: "Relationship notes", kind: "textarea", full: true, placeholder: "Context that will help the team work well with them." },
        ]}
        aside={<><span className="eyebrow">KEEP IT USEFUL</span><h3>Only what the team needs.</h3><p>Use a preferred channel and a little context to make future conversations thoughtful. Avoid collecting sensitive personal details.</p><ul><li>Davao City, Tagum, Nabunturan</li><li>Link work through orders</li><li>Updates are shared with active members</li></ul></>}
      />
      <p className="cell-secondary" style={{ marginTop: 12 }}><Link href="/leads">Looking for a prospect? Add a lead instead.</Link></p>
    </>
  );
}

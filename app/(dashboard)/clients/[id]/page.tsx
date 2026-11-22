import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import RecordForm from "@/components/record-form";
import StatusBadge from "@/components/status-badge";
import { updateClientRecord } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> };

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const { data: client, error: clientError } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (clientError) return <QueryError message={clientError.message} />;
  if (!client) notFound();

  const { data: orders, error: ordersError } = await supabase.from("orders").select("*").eq("client_id", id).order("created_at", { ascending: false });
  if (ordersError) return <QueryError message={ordersError.message} />;

  return (
    <>
      <PageHeading eyebrow={client.location.toUpperCase()} title={client.full_name} description={client.organization || "Individual client"} action={<Link href="/orders/new" className="button button-primary"><Plus size={15} /> New project</Link>} />
      <Notice error={notice.error} message={notice.message} />
      <div className="detail-grid">
        <section className="panel detail-card">
          <div className="panel-heading"><div><span className="eyebrow">CLIENT PROFILE</span><h2>Contact details</h2></div><span className="panel-meta">Added {formatDate(client.created_at)}</span></div>
          <div className="detail-rows">
            <div className="detail-row"><span>Organization</span><strong>{client.organization || "—"}</strong></div>
            <div className="detail-row"><span>Email</span><strong>{client.email || "—"}</strong></div>
            <div className="detail-row"><span>Phone</span><strong>{client.phone || "—"}</strong></div>
            <div className="detail-row"><span>Preferred channel</span><strong>{client.preferred_contact}</strong></div>
            <div className="detail-row"><span>Notes</span><strong>{client.notes || "No notes yet."}</strong></div>
          </div>
          <div className="panel-heading" style={{ marginTop: 22 }}><div><span className="eyebrow">WORK HISTORY</span><h2>Projects together <span className="panel-meta">· {orders.length}</span></h2></div></div>
          {orders.length ? <div className="card-list">{orders.map((order) => <Link className="info-card" href={`/orders/${order.id}`} key={order.id}>
            <div className="info-card-top"><h3>{order.title}</h3><StatusBadge value={order.status} /></div>
            <div className="info-card-foot"><span>Due {formatDate(order.due_date)}</span><span>{order.priority} priority</span></div>
          </Link>)}</div> : <div className="empty-state"><FolderKanban size={22} /><strong>No projects linked yet</strong><p>New work for this client will collect here.</p></div>}
        </section>
        <section className="panel detail-card">
          <div className="panel-heading"><div><span className="eyebrow">KEEP IT CURRENT</span><h2>Edit client</h2></div></div>
          <Notice error={notice.error} message={notice.message} />
          <RecordForm
            action={updateClientRecord}
            cancelHref={`/clients/${client.id}`}
            submitLabel="Save changes"
            fields={[
              { name: "id", label: "Client ID", kind: "hidden", value: client.id },
              { name: "full_name", label: "Contact name", required: true, value: client.full_name },
              { name: "organization", label: "Organization", value: client.organization },
              { name: "email", label: "Email", kind: "email", value: client.email ?? "" },
              { name: "phone", label: "Phone", kind: "tel", value: client.phone ?? "" },
              { name: "location", label: "Location", kind: "select", required: true, value: client.location, options: ["Davao City", "Tagum City", "Nabunturan", "Other Davao Region"].map((item) => ({ value: item, label: item })) },
              { name: "preferred_contact", label: "Preferred contact", kind: "select", required: true, value: client.preferred_contact, options: ["Messenger", "Email", "Phone", "Other"].map((item) => ({ value: item, label: item })) },
              { name: "notes", label: "Notes", kind: "textarea", full: true, value: client.notes },
            ]}
          />
        </section>
      </div>
    </>
  );
}

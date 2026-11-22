import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import StatusForm from "@/components/status-form";
import { createTask } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const statuses = ["Inquiry", "Quoted", "Confirmed", "Briefing", "In design", "Client review", "Revision", "Approved", "With print partner", "Ready for delivery", "Completed", "On hold", "Cancelled"];
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> };

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const [orderResult, clientsResult, profilesResult, proofsResult, tasksResult] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("clients").select("id,full_name,organization"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true),
    supabase.from("proofs").select("id,version,status,file_name,submitted_at").eq("order_id", id).order("version", { ascending: false }),
    supabase.from("tasks").select("*").eq("order_id", id).order("due_on"),
  ]);
  const error = orderResult.error || clientsResult.error || profilesResult.error || proofsResult.error || tasksResult.error;
  if (error) return <QueryError message={error.message} />;
  const order = orderResult.data;
  if (!order) notFound();
  const client = clientsResult.data.find((item) => item.id === order.client_id);
  const owner = profilesResult.data.find((item) => item.id === order.owner_id);

  return (
    <>
      <PageHeading eyebrow={`${order.priority.toUpperCase()} PRIORITY · ${formatDate(order.due_date)}`} title={order.title} description={client?.organization || client?.full_name || "Client"} action={<Link className="button button-secondary" href={`/proofs/${order.id}`}>Proof history ↗</Link>} />
      <Notice error={notice.error} message={notice.message} />
      <div className="detail-grid">
        <div className="record-column">
          <section className="panel detail-card">
            <div className="panel-heading"><div><span className="eyebrow">PROJECT STATUS</span><h2>Move the work forward</h2></div><StatusBadge value={order.status} /></div>
            <StatusForm action={updateOrderStatus} id={order.id} status={order.status} options={statuses} label="Update stage" />
            <div className="detail-rows" style={{ marginTop: 16 }}>
              <div className="detail-row"><span>Client</span><strong>{client?.full_name || "—"} · {client?.organization || "Individual"}</strong></div>
              <div className="detail-row"><span>Owner</span><strong>{owner?.full_name || "Unassigned"}</strong></div>
              <div className="detail-row"><span>Target date</span><strong>{formatDate(order.due_date)}</strong></div>
              <div className="detail-row"><span>Brief</span><strong>{order.brief || "No brief recorded."}</strong></div>
              <div className="detail-row"><span>Deliverables</span><strong>{order.deliverables || "No deliverables recorded."}</strong></div>
              <div className="detail-row"><span>Internal notes</span><strong>{order.internal_notes || "No internal notes."}</strong></div>
            </div>
          </section>
          <section className="panel detail-card">
            <div className="panel-heading"><div><span className="eyebrow">DESIGN APPROVAL</span><h2>Proofs & revisions</h2></div><Link className="panel-link" href={`/proofs/${order.id}`}>Open proof room ↗</Link></div>
            {proofsResult.data.length ? <div className="card-list">{proofsResult.data.map((proof) => <div className="info-card" key={proof.id}><div className="info-card-top"><h3>Version {proof.version} · {proof.file_name}</h3><StatusBadge value={proof.status} /></div><div className="info-card-foot"><span>Uploaded {formatDate(proof.submitted_at)}</span></div></div>)}</div> : <div className="empty-state"><span>▧</span><strong>No proofs shared yet</strong><p>Upload an approved design preview to begin the client feedback trail.</p></div>}
          </section>
        </div>
        <div className="record-column">
          <section className="panel detail-card">
            <div className="panel-heading"><div><span className="eyebrow">NEXT ACTIONS</span><h2>Project tasks</h2></div><span className="panel-meta">{tasksResult.data.filter((task) => !task.completed_at).length} open</span></div>
            <form action={createTask} className="form-stack">
              <input type="hidden" name="order_id" value={order.id} />
              <label className="field"><span>New task</span><input name="title" placeholder="One clear next step" required maxLength={180} /></label>
              <label className="field"><span>Assign to</span><select name="assignee_id"><option value="">Unassigned</option>{profilesResult.data.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</select></label>
              <label className="field"><span>Due date</span><input name="due_on" type="date" /></label>
              <button className="button button-primary" type="submit">Add task</button>
            </form>
            <div className="card-list" style={{ marginTop: 14 }}>{tasksResult.data.map((task) => <div className="info-card" key={task.id}>
              <div className="info-card-top"><h3>{task.title}</h3><span className={task.completed_at ? "catalog-state" : "panel-meta"}>{task.completed_at ? "DONE" : "OPEN"}</span></div>
              <div className="info-card-foot"><span>{profilesResult.data.find((profile) => profile.id === task.assignee_id)?.full_name || "Unassigned"}</span><span>{formatDate(task.due_on)}</span></div>
            </div>)}</div>
          </section>
          <section className="panel detail-card"><span className="eyebrow">CLIENT RECORD</span><h2 className="aside-title">{client?.full_name || "Client"}</h2><p className="aside-copy">Keep decisions, promised dates, and internal notes distinct. Production depends on partner capacity.</p>{client && <Link className="button button-secondary button-small" href={`/clients/${client.id}`}>View client history ↗</Link>}</section>
        </div>
      </div>
    </>
  );
}

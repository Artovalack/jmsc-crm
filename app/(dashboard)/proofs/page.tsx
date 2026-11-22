import Link from "next/link";
import { FileCheck2, FolderKanban, Info } from "lucide-react";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function ProofsPage() {
  const supabase = await createClient();
  const [ordersResult, clientsResult, proofsResult] = await Promise.all([
    supabase.from("orders").select("id,title,status,client_id").order("updated_at", { ascending: false }),
    supabase.from("clients").select("id,full_name,organization"),
    supabase.from("proofs").select("id,order_id,version,status,file_name,submitted_at").order("submitted_at", { ascending: false }).limit(10),
  ]);
  const error = ordersResult.error || clientsResult.error || proofsResult.error;
  if (error) return <QueryError message={error.message} />;
  const clients = new Map(clientsResult.data.map((client) => [client.id, client.organization || client.full_name]));
  const orders = new Map(ordersResult.data.map((order) => [order.id, order]));

  return (
    <>
      <PageHeading eyebrow="DESIGN REVIEW, MADE VISIBLE" title="Proofs & revisions" description="Keep the file version, client feedback, and approval decision together." />
      <div className="phase-note"><Info size={16} /><span>Proof files are private and visible to active JMSC members only. This is an internal review tracker, not a client portal.</span></div>
      <section className="panel panel-pad">
        <div className="panel-heading"><div><span className="eyebrow">PROJECT PROOF ROOMS</span><h2>Choose a project</h2></div></div>
        {ordersResult.data.length ? <div className="card-list">{ordersResult.data.map((order) => <Link className="info-card" href={`/proofs/${order.id}`} key={order.id}>
          <div className="info-card-top"><h3>{order.title}</h3><StatusBadge value={order.status} /></div>
          <div className="info-card-foot"><span>{clients.get(order.client_id) || "Client"}</span><span>Open proof history ↗</span></div>
        </Link>)}</div> : <div className="empty-state"><FolderKanban size={22} /><strong>No projects yet</strong><p>Create a project before uploading design proofs.</p></div>}
      </section>
      <section className="panel panel-pad" style={{ marginTop: 12 }}>
        <div className="panel-heading"><div><span className="eyebrow">RECENT FILE REVIEWS</span><h2>Latest proofs</h2></div></div>
        {proofsResult.data.length ? <div className="table-wrap"><table><thead><tr><th>Project</th><th>Version</th><th>File</th><th>Status</th><th>Uploaded</th></tr></thead><tbody>
          {proofsResult.data.map((proof) => <tr key={proof.id}><td><Link className="cell-primary" href={`/proofs/${proof.order_id}`}>{orders.get(proof.order_id)?.title || "Project"}</Link></td><td>v{proof.version}</td><td>{proof.file_name}</td><td><StatusBadge value={proof.status} /></td><td>{formatDate(proof.submitted_at)}</td></tr>)}
        </tbody></table></div> : <div className="empty-state"><FileCheck2 size={22} /><strong>No proofs shared yet</strong><p>Upload an image or PDF from a project&apos;s proof room to begin the review history.</p></div>}
      </section>
    </>
  );
}

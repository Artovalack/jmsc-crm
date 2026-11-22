import Link from "next/link";
import { notFound } from "next/navigation";
import { createProof, updateProofReview } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import RecordForm from "@/components/record-form";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ error?: string; message?: string }> };

export default async function OrderProofsPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const [orderResult, proofsResult] = await Promise.all([
    supabase.from("orders").select("id,title,status").eq("id", orderId).maybeSingle(),
    supabase.from("proofs").select("*").eq("order_id", orderId).order("version", { ascending: false }),
  ]);
  if (orderResult.error || proofsResult.error) return <QueryError message={orderResult.error?.message || proofsResult.error?.message || "Query failed"} />;
  const order = orderResult.data;
  if (!order) notFound();

  const proofFiles = await Promise.all(proofsResult.data.map(async (proof) => {
    const { data, error } = await supabase.storage.from("proof-files").createSignedUrl(proof.file_path, 60 * 10);
    if (error) console.error(`Could not create a temporary proof link for ${proof.id}.`, error);
    return { proof, url: data?.signedUrl ?? null };
  }));

  return (
    <>
      <PageHeading eyebrow="PROOF ROOM · INTERNAL" title={order.title} description="Upload versions, capture feedback, and record approval." action={<Link className="button button-secondary" href="/proofs">All proofs</Link>} />
      <Notice error={notice.error} message={notice.message} />
      <div className="detail-grid">
        <section className="panel detail-card">
          <div className="panel-heading"><div><span className="eyebrow">VERSION HISTORY</span><h2>Proofs & client decisions</h2></div><StatusBadge value={order.status} /></div>
          {proofFiles.length ? <div className="card-list">{proofFiles.map(({ proof, url }) => <article className="info-card" key={proof.id}>
            <div className="info-card-top"><h3>Version {proof.version}</h3><StatusBadge value={proof.status} /></div>
            <p>{url ? <a className="file-link" href={url} target="_blank" rel="noreferrer">{proof.file_name} ↗</a> : <span>{proof.file_name} · temporary link unavailable</span>}</p>
            <div className="info-card-foot"><span>Uploaded {formatDateTime(proof.submitted_at)}</span><span>{proof.reviewed_at ? `Reviewed ${formatDateTime(proof.reviewed_at)}` : "Awaiting review"}</span></div>
            <form action={updateProofReview} className="proof-review-form">
              <input type="hidden" name="id" value={proof.id} /><input type="hidden" name="order_id" value={order.id} />
              <label className="field"><span>Decision</span><select name="status" defaultValue={proof.status}><option>Shared for review</option><option>Revision requested</option><option>Approved</option></select></label>
              <label className="field"><span>Feedback / revision notes</span><textarea name="client_feedback" rows={2} defaultValue={proof.client_feedback} placeholder="Summarize what the client said and what changes are needed." /></label>
              <button className="button button-secondary button-small" type="submit">Save review</button>
            </form>
          </article>)}</div> : <div className="empty-state"><span>▧</span><strong>No proof versions yet</strong><p>Upload the first review image or PDF when the design is ready.</p></div>}
        </section>
        <section className="panel detail-card">
          <div className="panel-heading"><div><span className="eyebrow">NEW DESIGN VERSION</span><h2>Upload a proof</h2></div></div>
          <RecordForm action={createProof} cancelHref={`/orders/${order.id}`} submitLabel="Upload proof" fields={[
            { name: "order_id", label: "Project", kind: "hidden", value: order.id },
            { name: "proof_file", label: "Design file", kind: "file", required: true, accept: "image/jpeg,image/png,image/webp,application/pdf", hint: "JPEG, PNG, WebP, or PDF · 20 MB max" },
          ]} aside={<><span className="eyebrow">VERSIONING</span><h3>Each upload is a new revision.</h3><p>Files are privately stored in Supabase Storage. Add client feedback after the review and never share internal project notes in a client-facing file name.</p></>} />
        </section>
      </div>
    </>
  );
}

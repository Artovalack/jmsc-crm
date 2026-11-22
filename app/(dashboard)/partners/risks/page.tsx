import Link from "next/link";
import { createPartnerRisk, updatePartnerRisk } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import StatusForm from "@/components/status-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const riskStatuses = ["Open", "Monitoring", "Resolved"];
type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function PartnerRisksPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const [risksResult, partnersResult, ordersResult] = await Promise.all([
    supabase.from("partner_risks").select("*").order("created_at", { ascending: false }),
    supabase.from("partners").select("id,name").order("name"),
    supabase.from("orders").select("id,title"),
  ]);
  const error = risksResult.error || partnersResult.error || ordersResult.error;
  if (error) return <QueryError message={error.message} />;
  const partners = new Map(partnersResult.data.map((partner) => [partner.id, partner.name]));
  const orders = new Map(ordersResult.data.map((order) => [order.id, order.title]));

  return (
    <>
      <PageHeading eyebrow="QUALITY & SCHEDULE WATCH" title="Partner risk log" description="Keep schedule, quality, color, communication, and cost issues visible." action={<Link className="button button-secondary" href="/partners">Partner directory</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="detail-grid">
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">OPEN + RESOLVED</span><h2>Risk history</h2></div><span className="panel-meta">{risksResult.data.filter((risk) => risk.status !== "Resolved").length} open</span></div>
          {risksResult.data.length ? <div className="card-list">{risksResult.data.map((risk) => <article className="info-card" key={risk.id}>
            <div className="info-card-top"><h3>{risk.category} · {risk.severity}</h3><StatusBadge value={risk.status} /></div>
            <p>{risk.summary}</p>
            <div className="info-card-foot"><span>{partners.get(risk.partner_id) || "Partner"} · {orders.get(risk.order_id ?? "") || "Partner-wide"}</span><span>{formatDate(risk.created_at)}</span></div>
            <StatusForm action={updatePartnerRisk} id={risk.id} status={risk.status} options={riskStatuses} label="Update risk" />
          </article>)}</div> : <div className="empty-state"><span>✳</span><strong>No risks recorded</strong><p>Log a risk early so the team has time to manage expectations.</p></div>}
        </section>
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">ADD A RISK</span><h2>Log partner issue</h2></div></div>
          {!partnersResult.data.length ? <div className="notice-inline">Add a print partner before creating a risk record.</div> : <form action={createPartnerRisk} className="form-stack">
            <label className="field"><span>Print partner</span><select name="partner_id" required>{partnersResult.data.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
            <label className="field"><span>Related project (optional)</span><select name="order_id"><option value="">Partner-wide risk</option>{ordersResult.data.map((order) => <option key={order.id} value={order.id}>{order.title}</option>)}</select></label>
            <label className="field"><span>Category</span><select name="category" required>{["Schedule delay", "Print quality", "Color variance", "Communication", "Cost change", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>Severity</span><select name="severity" required><option>Low</option><option selected>Medium</option><option>High</option></select></label>
            <label className="field"><span>What happened?</span><textarea name="summary" rows={4} maxLength={500} required placeholder="Record the issue, impact, and planned follow-up." /></label>
            <button className="button button-primary" type="submit">Log risk <span>↗</span></button>
          </form>}
        </section>
      </div>
    </>
  );
}

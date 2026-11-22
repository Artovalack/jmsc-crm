import Link from "next/link";
import PageHeading from "@/components/page-heading";
import Notice from "@/components/notice";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function PartnersPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const [partnersResult, handoffsResult, ordersResult, risksResult] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase.from("production_handoffs").select("*").order("promised_date"),
    supabase.from("orders").select("id,title"),
    supabase.from("partner_risks").select("*").neq("status", "Resolved").order("created_at", { ascending: false }),
  ]);
  const error = partnersResult.error || handoffsResult.error || ordersResult.error || risksResult.error;
  if (error) return <QueryError message={error.message} />;
  const partners = new Map(partnersResult.data.map((partner) => [partner.id, partner]));
  const orders = new Map(ordersResult.data.map((order) => [order.id, order.title]));

  return (
    <>
      <PageHeading eyebrow="DESIGN TO PRINT, WITH CARE" title="Print partners" description="Track external production without promising what JMSC cannot control." action={<Link className="button button-primary" href="/partners/new">＋ Add a partner</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="partner-note"><span>⌁</span><div><strong>Partner-made, JMSC-managed.</strong><p>Keep approved files, specifications, promised dates, and quality notes together. A partner&apos;s timeline is not a guaranteed delivery date.</p></div></div>
      <div className="metric-strip"><span><strong>{partnersResult.data.filter((partner) => partner.active).length}</strong> active partners</span><span><strong>{handoffsResult.data.filter((job) => !["Delivered", "Ready"].includes(job.status)).length}</strong> open handoffs</span><span><strong>{risksResult.data.length}</strong> risks to watch</span></div>
      <div className="dashboard-grid">
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">EXTERNAL PRODUCTION</span><h2>Handoffs</h2></div><Link className="panel-link" href="/partners/handoffs/new">＋ New handoff</Link></div>
          {handoffsResult.data.length ? <div className="card-list">{handoffsResult.data.map((handoff) => <Link className="info-card" href={`/partners/${handoff.partner_id}`} key={handoff.id}>
            <div className="info-card-top"><h3>{orders.get(handoff.order_id) || "Project"}</h3><StatusBadge value={handoff.status} /></div>
            <p>{partners.get(handoff.partner_id)?.name || "Print partner"} · {handoff.quantity} pcs · {handoff.specifications}</p>
            <div className="info-card-foot"><span>Expected {formatDate(handoff.promised_date)}</span><span>{handoff.tracking_reference || "No tracking reference"}</span></div>
          </Link>)}</div> : <div className="empty-state"><span>⌁</span><strong>No production handoffs</strong><p>Approved print-ready work will show up here.</p><Link className="button button-secondary button-small" href="/partners/handoffs/new">Create handoff</Link></div>}
        </section>
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">PARTNER DIRECTORY</span><h2>Print shops</h2></div><Link className="panel-link" href="/partners/risks">Risk log ↗</Link></div>
          {partnersResult.data.length ? <div className="card-list">{partnersResult.data.map((partner) => <Link href={`/partners/${partner.id}`} className="info-card" key={partner.id}>
            <div className="info-card-top"><h3>{partner.name}</h3><span className={`catalog-state ${partner.active ? "" : "catalog-state-off"}`}>{partner.active ? "ACTIVE" : "PAUSED"}</span></div>
            <p>{partner.capabilities || "Capabilities not recorded."}</p>
            <div className="info-card-foot"><span>{partner.location || "Region not recorded"}</span><span>{partner.contact_name || "No named contact"}</span></div>
          </Link>)}</div> : <div className="empty-state"><span>⌁</span><strong>No partners yet</strong><p>Add trusted print shops before creating a production handoff.</p><Link className="button button-secondary button-small" href="/partners/new">Add first partner</Link></div>}
        </section>
      </div>
      <section className="panel detail-card" style={{ marginTop: 12 }}><div className="panel-heading"><div><span className="eyebrow">QUALITY & SCHEDULE</span><h2>Open partner risks</h2></div><Link className="panel-link" href="/partners/risks">Manage risk log ↗</Link></div>
        {risksResult.data.length ? <div className="table-wrap"><table><thead><tr><th>Partner</th><th>Issue</th><th>Related project</th><th>Severity</th><th>Status</th></tr></thead><tbody>{risksResult.data.slice(0, 5).map((risk) => <tr key={risk.id}><td>{partners.get(risk.partner_id)?.name || "Partner"}</td><td>{risk.category} · {risk.summary}</td><td>{orders.get(risk.order_id ?? "") || "—"}</td><td>{risk.severity}</td><td><StatusBadge value={risk.status} /></td></tr>)}</tbody></table></div> : <div className="empty-state"><span>✳</span><strong>No open partner risks</strong><p>Log schedule, quality, color, or cost issues early so the team can plan with care.</p></div>}
      </section>
    </>
  );
}

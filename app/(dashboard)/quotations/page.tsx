import Link from "next/link";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { updateQuotationStatus } from "@/app/actions";
import { formatDate, formatPHP } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const quoteStatuses = ["Draft", "Sent", "Accepted", "Declined", "Expired"];
type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function QuotationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const [quotesResult, clientsResult] = await Promise.all([
    supabase.from("quotations").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id,full_name,organization"),
  ]);
  if (quotesResult.error || clientsResult.error) return <QueryError message={quotesResult.error?.message || clientsResult.error?.message || "Query failed"} />;
  const clients = new Map(clientsResult.data.map((client) => [client.id, client.organization || client.full_name]));

  return (
    <>
      <PageHeading eyebrow="CLEAR SCOPE. GOOD EXPECTATIONS." title="Quotations" description="A thoughtful estimate makes the work easier for everyone." action={<Link className="button button-primary" href="/quotations/new">＋ New quotation</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="quote-summary"><div><span>Drafts</span><strong>{quotesResult.data.filter((quote) => quote.status === "Draft").length}</strong></div><div><span>Awaiting response</span><strong>{quotesResult.data.filter((quote) => quote.status === "Sent").length}</strong></div><div><span>Accepted</span><strong>{quotesResult.data.filter((quote) => quote.status === "Accepted").length}</strong></div><a className="button button-secondary button-small" href="/api/exports?type=quotations">Export CSV ↓</a></div>
      <section className="panel panel-pad">
        {quotesResult.data.length ? <div className="table-wrap"><table><thead><tr><th>Quote</th><th>Client</th><th>Scope</th><th>Amount</th><th>Valid until</th><th>Status</th></tr></thead><tbody>
          {quotesResult.data.map((quote) => <tr key={quote.id}><td className="quote-number">JMSC-{String(quote.quote_number).padStart(5, "0")}</td><td>{clients.get(quote.client_id) || "Client"}</td><td>{quote.service_summary}</td><td className="amount-cell">{formatPHP(quote.amount_php)}</td><td>{formatDate(quote.valid_until)}</td><td><div className="quote-status-cell"><StatusBadge value={quote.status} /><form action={updateQuotationStatus}><input type="hidden" name="id" value={quote.id} /><label className="sr-only" htmlFor={`quote-status-${quote.id}`}>Update quotation status</label><select className="inline-select" name="status" id={`quote-status-${quote.id}`} defaultValue={quote.status}>{quoteStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="button button-secondary button-small">Save</button></form></div></td></tr>)}
        </tbody></table></div> : <div className="empty-state"><span>₱</span><strong>No quotations yet</strong><p>Draft estimates will stay internal until your team is ready to send them.</p><Link className="button button-secondary button-small" href="/quotations/new">Create a draft</Link></div>}
      </section>
      <p className="phase-note" style={{ marginTop: 12 }}><span>i</span><span>Quotation totals are restricted to client-relations, finance, and admin roles. Send and payment processing remain manual; confirm assumptions and validity with the client.</span></p>
    </>
  );
}

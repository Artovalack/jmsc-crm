import Link from "next/link";
import { Search } from "lucide-react";
import { convertLead, updateLeadStatus } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { searchTerm } from "@/lib/search";

const stages = ["New inquiry", "Contacted", "Quoted", "Won", "Not proceeding"];
type Props = { searchParams: Promise<{ q?: string; status?: string; error?: string; message?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchTerm(params.q ?? "");
  const supabase = await createClient();
  let request = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (params.status) request = request.eq("status", params.status);
  if (query) request = request.or(`full_name.ilike.%${query}%,organization.ilike.%${query}%,requested_service.ilike.%${query}%`);
  const [leadsResult, profilesResult] = await Promise.all([
    request,
    supabase.from("profiles").select("id,full_name").eq("is_active", true),
  ]);
  if (leadsResult.error || profilesResult.error) return <QueryError message={leadsResult.error?.message || profilesResult.error?.message || "Query failed"} />;
  const owners = new Map(profilesResult.data.map((profile) => [profile.id, profile.full_name]));

  return (
    <>
      <PageHeading eyebrow="NEW WORK STARTS HERE" title="Leads & inquiries" description="Every good project begins with a conversation." action={<Link href="/leads/new" className="button button-primary">＋ Add a lead</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="toolbar">
        <form className="toolbar-search" method="get">
          <Search size={14} color="#849087" />
          <label className="sr-only" htmlFor="lead-search">Search leads</label>
          <input id="lead-search" name="q" type="search" defaultValue={query} placeholder="Search contact, organization, service..." />
          <select className="filter-select" name="status" defaultValue={params.status ?? ""} aria-label="Filter leads by stage">
            <option value="">All stages</option>{stages.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
          </select>
          <button className="button button-secondary button-small" type="submit">Filter</button>
        </form>
        <div className="table-actions"><span className="panel-meta">{leadsResult.data.length} inquiries</span><a className="button button-secondary button-small" href="/api/exports?type=leads">Export CSV ↓</a></div>
      </div>
      <section className="panel panel-pad">
        {leadsResult.data.length ? <div className="table-wrap"><table><thead><tr><th>Contact</th><th>Requested work</th><th>Stage</th><th>Owner</th><th>Follow-up</th><th>Action</th></tr></thead>
          <tbody>{leadsResult.data.map((lead) => <tr key={lead.id}>
            <td><div className="cell-primary">{lead.full_name}</div><div className="cell-secondary">{lead.organization || lead.source} · {lead.location}</div></td>
            <td>{lead.requested_service}</td>
            <td><StatusBadge value={lead.status} /></td>
            <td>{owners.get(lead.owner_id ?? "") || "Unassigned"}</td>
            <td>{formatDate(lead.follow_up_on)}</td>
            <td><div className="table-actions">
              <form action={updateLeadStatus} className="inline-form">
                <input type="hidden" name="id" value={lead.id} />
                <label className="sr-only" htmlFor={`stage-${lead.id}`}>Stage for {lead.full_name}</label>
                <select className="inline-select" name="status" id={`stage-${lead.id}`} defaultValue={lead.status}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select>
                <button className="button button-secondary button-small" type="submit">Save</button>
              </form>
              {lead.status === "Won" && !lead.converted_client_id && <form action={convertLead}><input type="hidden" name="id" value={lead.id} /><button className="button button-primary button-small" type="submit">Make client</button></form>}
              {lead.converted_client_id && <Link className="panel-link" href={`/clients/${lead.converted_client_id}`}>Client ↗</Link>}
            </div></td>
          </tr>)}</tbody>
        </table></div> : <div className="empty-state"><span>↗</span><strong>No matching inquiries</strong><p>Add an inquiry and capture its next follow-up before the conversation gets cold.</p><Link href="/leads/new" className="button button-secondary button-small">Add a lead</Link></div>}
      </section>
    </>
  );
}

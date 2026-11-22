import Link from "next/link";
import { Layers3, Plus, Search } from "lucide-react";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { searchTerm } from "@/lib/search";

const stages = ["Inquiry", "Quoted", "Confirmed", "Briefing", "In design", "Client review", "Revision", "Approved", "With print partner", "Ready for delivery", "Completed", "On hold", "Cancelled"];
type Props = { searchParams: Promise<{ q?: string; status?: string; error?: string; message?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchTerm(params.q ?? "");
  const supabase = await createClient();
  let request = supabase.from("orders").select("*").order("due_date", { ascending: true });
  if (params.status) request = request.eq("status", params.status);
  if (query) request = request.ilike("title", `%${query}%`);
  const [ordersResult, clientsResult, profilesResult] = await Promise.all([
    request,
    supabase.from("clients").select("id,full_name,organization"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true),
  ]);
  if (ordersResult.error || clientsResult.error || profilesResult.error) return <QueryError message={ordersResult.error?.message || clientsResult.error?.message || profilesResult.error?.message || "Query failed"} />;
  const clients = new Map(clientsResult.data.map((client) => [client.id, client.organization || client.full_name]));
  const owners = new Map(profilesResult.data.map((profile) => [profile.id, profile.full_name]));
  const activeOrders = ordersResult.data.filter((order) => !["Completed", "Cancelled"].includes(order.status));

  return (
    <>
      <PageHeading eyebrow="IDEAS INTO FINISHED WORK" title="Orders & projects" description="Keep the brief, owner, due date, and next milestone in view." action={<Link className="button button-primary" href="/orders/new"><Plus size={15} /> New project</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="metric-strip"><span><strong>{activeOrders.length}</strong> in motion</span><span><strong>{ordersResult.data.filter((order) => order.status === "Client review").length}</strong> awaiting client</span><span><strong>{ordersResult.data.filter((order) => order.status === "With print partner").length}</strong> with print partners</span></div>
      <div className="toolbar">
        <form className="toolbar-search" method="get"><Search size={14} color="#849087" /><label className="sr-only" htmlFor="order-search">Search projects</label><input id="order-search" name="q" type="search" defaultValue={query} placeholder="Search project title..." />
          <select className="filter-select" name="status" defaultValue={params.status ?? ""} aria-label="Filter by stage"><option value="">All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select>
          <button className="button button-secondary button-small">Filter</button></form>
        <div className="table-actions"><span className="panel-meta">{ordersResult.data.length} records</span><a className="button button-secondary button-small" href="/api/exports?type=orders">Export CSV ↓</a></div>
      </div>
      <section className="panel panel-pad">
        {ordersResult.data.length ? <div className="table-wrap"><table><thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Owner</th><th>Due</th><th>Priority</th></tr></thead>
          <tbody>{ordersResult.data.map((order) => <tr key={order.id}>
            <td><Link className="cell-primary" href={`/orders/${order.id}`}>{order.title}</Link><div className="cell-secondary">{order.brief.slice(0, 68) || "No brief added yet."}</div></td>
            <td>{clients.get(order.client_id) || "Client"}</td><td><StatusBadge value={order.status} /></td>
            <td>{owners.get(order.owner_id ?? "") || "Unassigned"}</td><td>{formatDate(order.due_date)}</td><td>{order.priority}</td>
          </tr>)}</tbody>
        </table></div> : <div className="empty-state"><Layers3 size={22} /><strong>No projects in this view</strong><p>Start a project to give the team one place to track scope and next steps.</p><Link href="/orders/new" className="button button-secondary button-small">Create a project</Link></div>}
      </section>
    </>
  );
}

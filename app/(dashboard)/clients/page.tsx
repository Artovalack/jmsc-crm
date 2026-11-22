import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import { createClient } from "@/lib/supabase/server";
import { searchTerm } from "@/lib/search";

type Props = { searchParams: Promise<{ q?: string; location?: string; error?: string; message?: string }> };

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchTerm(params.q ?? "");
  const supabase = await createClient();
  let request = supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (params.location) request = request.eq("location", params.location);
  if (query) request = request.or(`full_name.ilike.%${query}%,organization.ilike.%${query}%,email.ilike.%${query}%`);
  const { data: clients, error } = await request;
  if (error) return <QueryError message={error.message} />;

  return (
    <>
      <PageHeading eyebrow="THE PEOPLE BEHIND THE WORK" title="Clients" description="Build relationships worth returning to." action={<Link className="button button-primary" href="/clients/new"><Plus size={15} /> Add a client</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="toolbar">
        <form className="toolbar-search" method="get">
          <label className="sr-only" htmlFor="client-search">Search clients</label>
          <Search size={14} color="#849087" />
          <input id="client-search" name="q" type="search" defaultValue={query} placeholder="Search name, organization, email..." />
          <select className="filter-select" name="location" defaultValue={params.location ?? ""} aria-label="Filter by region">
            <option value="">All regions</option><option>Davao City</option><option>Tagum City</option><option>Nabunturan</option><option>Other Davao Region</option>
          </select>
          <button className="button button-secondary button-small" type="submit">Filter</button>
        </form>
        <div className="table-actions"><span className="panel-meta">{clients.length} client{clients.length === 1 ? "" : "s"}</span><a className="button button-secondary button-small" href="/api/exports?type=clients">Export CSV ↓</a></div>
      </div>
      <section className="panel panel-pad">
        {clients.length ? <div className="table-wrap"><table>
          <thead><tr><th>Client</th><th>Region</th><th>Contact</th><th>Preferred channel</th><th>Added</th><th /></tr></thead>
          <tbody>{clients.map((client) => <tr key={client.id}>
            <td><Link className="cell-primary" href={`/clients/${client.id}`}>{client.full_name}</Link><div className="cell-secondary">{client.organization || "Individual client"}</div></td>
            <td>{client.location}</td><td>{client.email || client.phone || "—"}</td><td>{client.preferred_contact}</td>
            <td>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(client.created_at))}</td>
            <td><Link className="panel-link" href={`/clients/${client.id}`}>Open ↗</Link></td>
          </tr>)}</tbody>
        </table></div> : <div className="empty-state"><Users size={22} /><strong>No clients in this view</strong><p>Add a client or change the search filters to see matching records.</p><Link className="button button-secondary button-small" href="/clients/new">Add first client</Link></div>}
      </section>
    </>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchTerm } from "@/lib/search";
import { updateCatalogItem } from "@/app/actions";
import PageHeading from "@/components/page-heading";
import Notice from "@/components/notice";
import QueryError from "@/components/query-error";
import { Search } from "lucide-react";

type Props = { searchParams: Promise<{ q?: string; category?: string; error?: string; message?: string }> };

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchTerm(params.q ?? "");
  const supabase = await createClient();
  let request = supabase.from("catalog_items").select("*").order("category").order("name");
  if (params.category) request = request.eq("category", params.category);
  if (query) request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  const { data: items, error } = await request;
  if (error) return <QueryError message={error.message} />;
  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <>
      <PageHeading eyebrow="THE JMSC SERVICE SPECTRUM" title="Service catalog" description="Keep digital work and print-ready production clear in one place." action={<Link className="button button-primary" href="/catalog/new">＋ Add a service</Link>} />
      <Notice error={params.error} message={params.message} />
      <div className="toolbar">
        <form className="toolbar-search" method="get">
          <Search size={14} color="#849087" /><label className="sr-only" htmlFor="catalog-search">Search catalog</label>
          <input id="catalog-search" name="q" type="search" defaultValue={query} placeholder="Search services..." />
          <select className="filter-select" name="category" defaultValue={params.category ?? ""} aria-label="Filter by category">
            <option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <button className="button button-secondary button-small">Filter</button>
        </form>
        <span className="panel-meta">{items.filter((item) => item.active).length} active services</span>
      </div>
      {items.length ? <div className="catalog-grid">{items.map((item, index) => <article className={`catalog-card ${!item.active ? "catalog-inactive" : ""}`} key={item.id}>
        <div className="catalog-card-top"><span className={`catalog-symbol catalog-symbol-${index % 4 + 1}`}>{item.is_physical ? "▧" : "✳"}</span><span className={`catalog-state ${item.active ? "" : "catalog-state-off"}`}>{item.active ? "AVAILABLE" : "PAUSED"}</span></div>
        <span className="eyebrow">{item.category.toUpperCase()} · {item.is_physical ? "PRINT-READY" : "DIGITAL"}</span>
        <h2>{item.name}</h2><p>{item.description || "No service notes yet."}</p>
        <form action={updateCatalogItem} className="catalog-card-foot"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={item.active ? "false" : "true"} /><span>{item.is_physical ? "External print partner may be required" : "Studio-delivered digital work"}</span><button className="panel-link" type="submit">{item.active ? "Pause" : "Activate"}</button></form>
      </article>)}</div> : <section className="panel"><div className="empty-state"><span>✳</span><strong>Start your service catalog</strong><p>Add the creative services clients come to JMSC for.</p><Link className="button button-secondary button-small" href="/catalog/new">Add first service</Link></div></section>}
    </>
  );
}

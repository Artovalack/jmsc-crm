import Link from "next/link";
import { ArrowUpRight, CircleCheck, CirclePlus, Clock3, Sparkles } from "lucide-react";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [ordersResult, leadsResult, tasksResult, activitiesResult, membersResult, clientsResult] = await Promise.all([
    supabase.from("orders").select("id,title,status,priority,due_date,owner_id,client_id").order("due_date", { ascending: true }).limit(8),
    supabase.from("leads").select("id,full_name,organization,status,follow_up_on").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id,title,order_id,lead_id,assignee_id,due_on,completed_at").order("due_on", { ascending: true }).limit(12),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id,full_name,role,is_active").eq("is_active", true),
    supabase.from("clients").select("id,full_name,organization"),
  ]);
  const queryError = ordersResult.error || leadsResult.error || tasksResult.error || activitiesResult.error || membersResult.error || clientsResult.error;
  if (queryError) return <QueryError message={queryError.message} />;

  const orders = ordersResult.data;
  const leads = leadsResult.data;
  const openTasks = tasksResult.data.filter((task) => !task.completed_at);
  const activeOrders = orders.filter((order) => !["Completed", "Cancelled"].includes(order.status));
  const overdueTasks = openTasks.filter((task) => task.due_on && task.due_on < new Date().toISOString().slice(0, 10));
  const profiles = new Map(membersResult.data.map((profile) => [profile.id, profile.full_name]));
  const clientNames = new Map(clientsResult.data.map((client) => [client.id, client.organization || client.full_name]));
  const pipeline = ["New inquiry", "Contacted", "Quoted"].map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.status === stage).length,
  }));
  const dueTasks = openTasks.slice(0, 5);

  return (
    <>
      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">{new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase()} · STUDIO SNAPSHOT</div>
          <h1>Good work,<br /><em>in good hands.</em></h1>
          <p>A little clarity for the creative work ahead.</p>
        </div>
        <div className="hero-side">
          <span className="hero-live"><i /> {activeOrders.length} projects in motion</span>
          <Link className="button button-primary" href="/leads/new"><CirclePlus size={14} /> Add a lead</Link>
        </div>
        <span className="hero-star" aria-hidden="true"><Sparkles size={27} /></span>
      </div>

      <div className="metric-grid">
        <article className="metric-card metric-dark"><div className="metric-label">Active projects <ArrowUpRight size={13} /></div><div className="metric-num">{String(activeOrders.length).padStart(2, "0")}</div><div className="metric-foot">Across the studio</div><span className="metric-mark">✳</span></article>
        <article className="metric-card"><div className="metric-label">Open leads <ArrowUpRight size={13} /></div><div className="metric-num">{String(leads.filter((lead) => !["Won", "Not proceeding"].includes(lead.status)).length).padStart(2, "0")}</div><div className="metric-foot">{leads.filter((lead) => lead.status === "New inquiry").length} new conversations</div></article>
        <article className="metric-card"><div className="metric-label">Needs attention <Clock3 size={13} /></div><div className="metric-num">{String(overdueTasks.length).padStart(2, "0")}</div><div className="metric-foot">{overdueTasks.length ? "Overdue tasks" : "No overdue tasks"}</div></article>
        <article className="metric-card"><div className="metric-label">Team rhythm <Sparkles size={13} /></div><div className="metric-team">{membersResult.data.slice(0, 5).map((member) => <span title={member.full_name} key={member.id}>{initials(member.full_name)}</span>)}</div><div className="metric-foot">{membersResult.data.length} active team members</div></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><span className="eyebrow">THE MAKING OF IT</span><h2>Work in motion</h2></div><Link className="panel-link" href="/orders">All orders ↗</Link></div>
          {activeOrders.length ? <div className="table-wrap"><table><thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Due</th></tr></thead><tbody>
            {activeOrders.slice(0, 5).map((order) => <tr key={order.id}>
              <td><Link className="cell-primary" href={`/orders/${order.id}`}>{order.title}</Link><div className="cell-secondary">{order.priority} priority</div></td>
              <td>{clientNames.get(order.client_id) || "Client"}</td><td><StatusBadge value={order.status} /></td><td>{formatDate(order.due_date)}</td>
            </tr>)}
          </tbody></table></div> : <div className="empty-state"><span>✳</span><strong>Nothing in motion just yet</strong><p>Start an order to give the team a clear next milestone.</p><Link className="button button-secondary button-small" href="/orders/new">Create a project</Link></div>}
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><span className="eyebrow">YOUR NEXT MOVES</span><h2>On the radar</h2></div><Link className="panel-link" href="/tasks">All tasks ↗</Link></div>
          {dueTasks.length ? <div className="focus-list">{dueTasks.map((task) => <div className="focus-item" key={task.id}>
            <CircleCheck size={15} color="#9aaa86" />
            <span className="focus-copy"><strong>{task.title}</strong><small>{profiles.get(task.assignee_id ?? "") || "Unassigned"}</small></span>
            <time>{formatDate(task.due_on, { month: "short", day: "numeric" })}</time>
          </div>)}</div> : <div className="empty-state"><span>✳</span><strong>All caught up</strong><p>No open tasks need attention.</p></div>}
          <Link className="quick-add" href="/tasks"><CirclePlus size={14} /> Add a follow-up</Link>
        </section>
      </div>

      <div className="dashboard-bottom">
        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><span className="eyebrow">FROM HELLO TO HANDOFF</span><h2>Lead pipeline</h2></div><Link className="panel-link" href="/leads">Open leads ↗</Link></div>
          <div className="pipeline-grid">{pipeline.map((item, index) => <div className="pipeline-step" key={item.stage}><span>0{index + 1}</span><b>{item.stage}</b><strong>{item.count}</strong></div>)}</div>
        </section>
        <section className="service-card"><span className="eyebrow">A NOTE TO THE TEAM</span><blockquote>“Be professional.<br />Stay human.<br /><em>Keep creating.</em>”</blockquote><small>JMSC STUDIO PRINCIPLE</small></section>
      </div>

      <section className="panel dashboard-panel" style={{ marginTop: 12 }}>
        <div className="panel-heading"><div><span className="eyebrow">THE STUDIO TRAIL</span><h2>Recent activity</h2></div><span className="panel-meta">Most recent changes</span></div>
        {activitiesResult.data.length ? <div className="activity-list">{activitiesResult.data.map((activity) => <div className="activity-row" key={activity.id}>
          <span className="activity-icon">{activity.action === "insert" ? "＋" : "↗"}</span>
          <div><strong>{activity.summary}</strong><small>{formatDateTime(activity.created_at)}</small></div>
        </div>)}</div> : <div className="empty-state"><span>✳</span><strong>Your studio story starts here</strong><p>Changes to leads, orders, and proofs will appear in this activity trail.</p></div>}
      </section>
    </>
  );
}

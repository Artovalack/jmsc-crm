import Link from "next/link";
import {
  ArrowRight, BriefcaseBusiness, CalendarClock, CircleAlert, CircleCheck, CirclePlus,
  FileCheck2, Handshake, Layers3, Users,
} from "lucide-react";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const leadStages = ["New inquiry", "Contacted", "Quoted"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return <QueryError message={authError.message} />;
  if (!user) return <QueryError message="Sign in to load your studio overview." />;

  const today = new Date().toISOString().slice(0, 10);
  const [
    [
      ordersResult,
      tasksResult,
      overdueTasksResult,
      overdueLeadsResult,
      activitiesResult,
      membersResult,
      clientsResult,
      proofsResult,
      risksResult,
      quotesResult,
    ],
    leadStageResults,
  ] = await Promise.all([
    Promise.all([
      supabase.from("orders")
        .select("id,title,status,priority,due_date,owner_id,client_id", { count: "exact" })
        .not("status", "in", "(Completed,Cancelled)")
        .order("due_date", { ascending: true })
        .limit(6),
      supabase.from("tasks")
        .select("id,title,order_id,lead_id,assignee_id,due_on,completed_at")
        .is("completed_at", null)
        .order("due_on", { ascending: true })
        .limit(6),
      supabase.from("tasks")
        .select("id", { count: "exact", head: true })
        .is("completed_at", null)
        .lt("due_on", today),
      supabase.from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", leadStages)
        .lte("follow_up_on", today),
      supabase.from("activity_log")
        .select("id,summary,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("profiles").select("id,full_name,role").eq("is_active", true),
      supabase.from("clients").select("id,full_name,organization"),
      supabase.from("proofs")
        .select("id", { count: "exact", head: true })
        .in("status", ["Shared for review", "Revision requested"]),
      supabase.from("partner_risks")
        .select("id", { count: "exact", head: true })
        .neq("status", "Resolved"),
      supabase.from("quotations")
        .select("id", { count: "exact", head: true })
        .in("status", ["Draft", "Sent"]),
    ]),
    Promise.all(leadStages.map((stage) =>
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", stage),
    )),
  ]);
  const queryError = ordersResult.error || tasksResult.error || activitiesResult.error
    || membersResult.error || clientsResult.error || proofsResult.error || risksResult.error
    || quotesResult.error || overdueTasksResult.error || overdueLeadsResult.error
    || leadStageResults.find((result) => result.error)?.error;
  if (queryError) return <QueryError message={queryError.message} />;

  const overdueTasksCount = overdueTasksResult.count ?? 0;
  const overdueLeadsCount = overdueLeadsResult.count ?? 0;
  const dueItems = overdueTasksCount + overdueLeadsCount;
  const profiles = new Map(membersResult.data.map((profile) => [profile.id, profile.full_name]));
  const clientNames = new Map(clientsResult.data.map((client) => [client.id, client.organization || client.full_name]));
  const pipeline = leadStages.map((stage, index) => ({
    stage,
    count: leadStageResults[index].count ?? 0,
  }));
  const pipelineTotal = pipeline.reduce((total, item) => total + item.count, 0);
  const quotesRole = membersResult.data.find((member) => member.id === user.id)?.role;
  const canSeeQuotes = ["admin", "client_relations", "finance"].includes(quotesRole ?? "");

  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase()}
        title="Studio overview"
        description="A clear view of current work, follow-ups, and decisions waiting on the team."
        action={<div className="dashboard-actions"><Link className="button button-secondary" href="/orders/new"><Layers3 size={15} /> New project</Link><Link className="button button-primary" href="/leads/new"><CirclePlus size={15} /> Add a lead</Link></div>}
      />

      <div className="metric-grid dashboard-metrics">
        <Link className="metric-card" href="/orders">
          <div className="metric-label">Active projects <Layers3 size={16} /></div>
          <div className="metric-num">{ordersResult.count ?? 0}</div>
          <div className="metric-foot">Open across the studio</div>
        </Link>
        <Link className={`metric-card ${dueItems ? "metric-attention" : ""}`} href={overdueTasksCount ? "/tasks" : "/leads"}>
          <div className="metric-label">Follow-ups due <CalendarClock size={16} /></div>
          <div className="metric-num">{dueItems}</div>
          <div className="metric-foot">{overdueTasksCount} tasks · {overdueLeadsCount} lead follow-ups</div>
        </Link>
        <Link className={proofsResult.count ? "metric-card metric-attention" : "metric-card"} href="/proofs">
          <div className="metric-label">Proof decisions <FileCheck2 size={16} /></div>
          <div className="metric-num">{proofsResult.count ?? 0}</div>
          <div className="metric-foot">Awaiting review or revision</div>
        </Link>
        <Link className={risksResult.count ? "metric-card metric-attention" : "metric-card"} href="/partners/risks">
          <div className="metric-label">Open production risks <Handshake size={16} /></div>
          <div className="metric-num">{risksResult.count ?? 0}</div>
          <div className="metric-foot">Partner issues to monitor</div>
        </Link>
      </div>

      <div className="dashboard-grid dashboard-primary-grid">
        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">DELIVERY</span><h2>Projects in motion</h2></div>
            <Link className="panel-link" href="/orders">All projects <ArrowRight size={13} /></Link>
          </div>
          {ordersResult.data.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Target date</th></tr></thead>
                <tbody>{ordersResult.data.map((order) => (
                  <tr key={order.id}>
                    <td><Link className="cell-primary" href={`/orders/${order.id}`}>{order.title}</Link><div className="cell-secondary">{order.priority} priority</div></td>
                    <td>{clientNames.get(order.client_id) || "Client"}</td>
                    <td><StatusBadge value={order.status} /></td>
                    <td>{formatDate(order.due_date)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><Layers3 size={21} /><strong>No projects in motion</strong><p>Create a project to track scope, ownership, and delivery.</p><Link className="button button-secondary button-small" href="/orders/new">Create a project</Link></div>
          )}
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">NEXT ACTIONS</span><h2>Tasks to move forward</h2></div>
            <Link className="panel-link" href="/tasks">All tasks <ArrowRight size={13} /></Link>
          </div>
          {tasksResult.data.length ? (
            <div className="focus-list">{tasksResult.data.slice(0, 6).map((task) => {
              const isOverdue = task.due_on && task.due_on < today;
              return (
                <div className={`focus-item ${isOverdue ? "focus-item-overdue" : ""}`} key={task.id}>
                  {isOverdue ? <CircleAlert size={16} aria-label="Overdue" /> : <CircleCheck size={16} aria-hidden="true" />}
                  <span className="focus-copy"><strong>{task.title}</strong><small>{profiles.get(task.assignee_id ?? "") || "Unassigned"}</small></span>
                  <time>{formatDate(task.due_on, { month: "short", day: "numeric" })}</time>
                </div>
              );
            })}</div>
          ) : (
            <div className="empty-state"><CircleCheck size={21} /><strong>No open tasks</strong><p>Tasks linked to projects or leads will appear here.</p><Link className="button button-secondary button-small" href="/tasks">Open task list</Link></div>
          )}
          {overdueLeadsCount > 0 && <Link className="dashboard-inline-alert" href="/leads"><CalendarClock size={14} /> {overdueLeadsCount} lead follow-up{overdueLeadsCount === 1 ? "" : "s"} due today or earlier <ArrowRight size={13} /></Link>}
        </section>
      </div>

      <div className="dashboard-bottom dashboard-secondary-grid">
        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">NEW BUSINESS</span><h2>Lead pipeline</h2></div>
            <Link className="panel-link" href="/leads">Open leads <ArrowRight size={13} /></Link>
          </div>
          <div className="pipeline-list">{pipeline.map((item) => {
            const width = pipelineTotal ? Math.max(4, Math.round(item.count / pipelineTotal * 100)) : 0;
            return (
              <div className="pipeline-row" key={item.stage}>
                <span>{item.stage}</span>
                <div className="pipeline-track" role="progressbar" aria-label={`${item.stage} leads`} aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={pipelineTotal || 1}>
                  <span style={{ width: `${width}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            );
          })}</div>
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">TEAM ACTIVITY</span><h2>Recent changes</h2></div>
            <span className="panel-meta">{membersResult.data.length} active team members <Users size={13} /></span>
          </div>
          {activitiesResult.data.length ? (
            <div className="activity-list">{activitiesResult.data.map((activity) => (
              <div className="activity-row" key={activity.id}>
                <span className="activity-icon"><CircleCheck size={13} /></span>
                <div><strong>{activity.summary}</strong><small>{formatDateTime(activity.created_at)}</small></div>
              </div>
            ))}</div>
          ) : (
            <div className="empty-state"><CircleCheck size={21} /><strong>No recent changes</strong><p>Updates to leads, projects, and proofs will appear here.</p></div>
          )}
        </section>
      </div>

      {canSeeQuotes && (
        <Link href="/quotations" className="dashboard-quote-note">
          <BriefcaseBusiness size={17} />
          <span><strong>{quotesResult?.count ?? 0} quotations need attention</strong><small>Drafts and sent estimates awaiting a status update</small></span>
          <ArrowRight size={15} />
        </Link>
      )}
    </>
  );
}

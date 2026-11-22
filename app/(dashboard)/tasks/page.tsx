import Link from "next/link";
import { createTask, updateTaskCompletion } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

type Props = { searchParams: Promise<{ error?: string; message?: string; filter?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const [tasksResult, ordersResult, leadsResult, profilesResult] = await Promise.all([
    supabase.from("tasks").select("*").order("due_on", { ascending: true }),
    supabase.from("orders").select("id,title"),
    supabase.from("leads").select("id,full_name,organization"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true),
  ]);
  const error = tasksResult.error || ordersResult.error || leadsResult.error || profilesResult.error;
  if (error) return <QueryError message={error.message} />;
  const orders = new Map(ordersResult.data.map((item) => [item.id, item.title]));
  const leads = new Map(leadsResult.data.map((item) => [item.id, item.organization || item.full_name]));
  const members = new Map(profilesResult.data.map((item) => [item.id, item.full_name]));
  const tasks = params.filter === "completed" ? tasksResult.data.filter((task) => task.completed_at) : tasksResult.data.filter((task) => !task.completed_at);

  return (
    <>
      <PageHeading eyebrow="THE LITTLE THINGS THAT MOVE IT" title="Tasks & follow-ups" description="A clear next step is a kind of momentum." />
      <Notice error={params.error} message={params.message} />
      <div className="toolbar">
        <div className="toolbar-form"><Link className={`button ${params.filter !== "completed" ? "button-primary" : "button-secondary"} button-small`} href="/tasks">Open</Link><Link className={`button ${params.filter === "completed" ? "button-primary" : "button-secondary"} button-small`} href="/tasks?filter=completed">Completed</Link></div>
        <span className="panel-meta">{tasks.length} {params.filter === "completed" ? "completed" : "open"} tasks</span>
      </div>
      <div className="detail-grid">
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">{params.filter === "completed" ? "GOOD WORK, DONE" : "UP NEXT"}</span><h2>{params.filter === "completed" ? "Completed tasks" : "Open tasks"}</h2></div></div>
          {tasks.length ? <div className="task-list">{tasks.map((task) => <div className={`task-row ${task.completed_at ? "task-done" : ""}`} key={task.id}>
            <form action={updateTaskCompletion}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="completed" value={task.completed_at ? "no" : "yes"} /><button className={`task-toggle ${task.completed_at ? "task-toggle-done" : ""}`} type="submit" aria-label={task.completed_at ? `Reopen ${task.title}` : `Complete ${task.title}`}>{task.completed_at ? "✓" : ""}</button></form>
            <span className="task-copy"><strong>{task.title}</strong><small>{task.order_id ? orders.get(task.order_id) : task.lead_id ? leads.get(task.lead_id) : "Unlinked"} · {members.get(task.assignee_id ?? "") || "Unassigned"}</small></span>
            <time>{formatDate(task.due_on)}</time>
          </div>)}</div> : <div className="empty-state"><span>☷</span><strong>{params.filter === "completed" ? "A fresh page" : "All caught up"}</strong><p>{params.filter === "completed" ? "Completed follow-ups will collect here." : "Create a task when a project or lead needs a next step."}</p></div>}
        </section>
        {params.filter !== "completed" && <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">ONE CLEAR NEXT STEP</span><h2>Add a task</h2></div></div>
          <form action={createTask} className="form-stack">
            <label className="field"><span>Task</span><input name="title" required maxLength={180} placeholder="What needs to happen?" /></label>
            <label className="field"><span>Link to project</span><select name="order_id"><option value="">Select a project</option>{ordersResult.data.map((order) => <option value={order.id} key={order.id}>{order.title}</option>)}</select></label>
            <label className="field"><span>Or link to lead</span><select name="lead_id"><option value="">Select a lead</option>{leadsResult.data.map((lead) => <option value={lead.id} key={lead.id}>{lead.organization || lead.full_name}</option>)}</select></label>
            <label className="field"><span>Assign to</span><select name="assignee_id"><option value="">Unassigned</option>{profilesResult.data.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</select></label>
            <label className="field"><span>Due date</span><input name="due_on" type="date" /></label>
            <button type="submit" className="button button-primary">Add task <span>↗</span></button>
          </form>
          <div className="notice-inline">A task must be linked to a project or a lead.</div>
        </section>}
      </div>
    </>
  );
}

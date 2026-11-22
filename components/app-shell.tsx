import Link from "next/link";
import {
  Activity, Archive, BriefcaseBusiness, Building2, ClipboardList, FileCheck2, Handshake,
  LayoutDashboard, LogOut, Settings2, Users, Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Profile } from "@/types/database";
import { signOut } from "@/app/actions";
import NavItem from "@/components/nav-item";

export default function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const canSeeQuotes = ["admin", "client_relations", "finance"].includes(profile.role);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="wordmark wordmark-light" href="/dashboard">
          <span className="wordmark-mark">JM<span>.</span></span>
          <span><strong>JMSC</strong><small>MEDIA WORKS</small></span>
        </Link>
        <div className="workspace-picker"><span className="workspace-symbol">✳</span><span><b>Studio Desk</b><small>Team workspace</small></span><span className="workspace-chevron">⌄</span></div>
        <div className="nav-section-label">STUDIO</div>
        <nav className="main-nav" aria-label="Studio">
          <NavItem href="/dashboard" label="Overview" icon={LayoutDashboard} />
          <NavItem href="/leads" label="Leads" icon={Workflow} />
          <NavItem href="/clients" label="Clients" icon={Users} />
          <NavItem href="/catalog" label="Service catalog" icon={Archive} />
          <NavItem href="/orders" label="Orders & projects" icon={ClipboardList} />
          <NavItem href="/tasks" label="Tasks" icon={Activity} />
        </nav>
        <div className="nav-section-label nav-section-spaced">HANDOFFS & GROWTH</div>
        <nav className="main-nav" aria-label="Handoffs and growth">
          <NavItem href="/proofs" label="Proofs & revisions" icon={FileCheck2} />
          <NavItem href="/partners" label="Print partners" icon={Handshake} />
          <NavItem href="/b2b" label="B2B pipeline" icon={Building2} />
          {canSeeQuotes && <NavItem href="/quotations" label="Quotations" icon={BriefcaseBusiness} />}
          {profile.role === "admin" && <NavItem href="/settings" label="Team settings" icon={Settings2} />}
        </nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            <span className="member-avatar">{profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JM"}</span>
            <span className="member-copy"><b>{profile.full_name || "Team member"}</b><small>{profile.role.replace("_", " ")}</small></span>
            <form action={signOut}><button className="icon-quiet" type="submit" aria-label="Sign out" title="Sign out"><LogOut size={15} /></button></form>
          </div>
          <span className="sidebar-motto">BE PROFESSIONAL <i>✳</i> STAY HUMAN</span>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-location"><span>JMSC</span><i>/</i><b>STUDIO OPERATIONS</b></div>
          <div className="topbar-right">
            <span className="secure-tag"><i /> PRIVATE TEAM SPACE</span>
            <span className="topbar-avatar">{profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JM"}</span>
          </div>
        </header>
        <section className="content-area">{children}</section>
        <footer className="main-footer"><span>JMSC MEDIA WORKS · DAVAO REGION</span><span>Be professional. Stay human. Keep creating.</span></footer>
      </main>
    </div>
  );
}

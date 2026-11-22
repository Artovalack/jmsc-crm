"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut, PanelLeftClose } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Profile } from "@/types/database";
import { signOut } from "@/app/actions";
import NavItem from "@/components/nav-item";
import MobileNavigation from "@/components/mobile-navigation";
import SidebarTooltip from "@/components/sidebar-tooltip";

export default function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const canSeeQuotes = ["admin", "client_relations", "finance"].includes(profile.role);
  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="sidebar-brand-row">
            <Link className="wordmark wordmark-light" href="/dashboard" aria-label="JMSC CRM home">
              <Image className="brand-logo brand-logo-sidebar" src="/jmsc-logo.png" alt="" width={40} height={44} priority />
              <span className="brand-copy"><strong>JMSC CRM</strong></span>
            </Link>
            {sidebarCollapsed ? (
              <SidebarTooltip label="Open sidebar">
                <button
                  className="sidebar-toggle sidebar-logo-toggle"
                  type="button"
                  aria-label="Open sidebar"
                  aria-expanded="false"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <Image className="brand-logo brand-logo-sidebar" src="/jmsc-logo.png" alt="" width={40} height={44} priority />
                </button>
              </SidebarTooltip>
            ) : (
              <button
                className="sidebar-toggle"
                type="button"
                aria-label="Collapse sidebar"
                aria-expanded="true"
                title="Collapse sidebar"
                onClick={() => setSidebarCollapsed(true)}
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
          <div className="workspace-context" role="group" aria-label="Current workspace">
            <span className="workspace-symbol"><LayoutDashboard size={15} /></span>
            <span><b>Studio Desk</b><small>Team workspace</small></span>
          </div>
          <div className="nav-section-label">STUDIO</div>
          <nav className="main-nav" aria-label="Studio">
            <NavItem href="/dashboard" label="Overview" icon="overview" collapsed={sidebarCollapsed} />
            <NavItem href="/leads" label="Leads" icon="leads" collapsed={sidebarCollapsed} />
            <NavItem href="/clients" label="Clients" icon="clients" collapsed={sidebarCollapsed} />
            <NavItem href="/catalog" label="Service catalog" icon="catalog" collapsed={sidebarCollapsed} />
            <NavItem href="/orders" label="Orders & projects" icon="orders" collapsed={sidebarCollapsed} />
            <NavItem href="/tasks" label="Tasks" icon="tasks" collapsed={sidebarCollapsed} />
          </nav>
          <div className="nav-section-label nav-section-spaced">HANDOFFS & GROWTH</div>
          <nav className="main-nav" aria-label="Handoffs and growth">
            <NavItem href="/proofs" label="Proofs & revisions" icon="proofs" collapsed={sidebarCollapsed} />
            <NavItem href="/partners" label="Print partners" icon="partners" collapsed={sidebarCollapsed} />
            <NavItem href="/b2b" label="B2B pipeline" icon="b2b" collapsed={sidebarCollapsed} />
            {canSeeQuotes && <NavItem href="/quotations" label="Quotations" icon="quotations" collapsed={sidebarCollapsed} />}
            {profile.role === "admin" && <NavItem href="/settings" label="Team settings" icon="settings" collapsed={sidebarCollapsed} />}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="member-card">
            <span className="member-avatar">{profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JM"}</span>
            <span className="member-copy"><b>{profile.full_name || "Team member"}</b><small>{profile.role.replace("_", " ")}</small></span>
            <form action={signOut}><button className="icon-quiet" type="submit" aria-label="Sign out" title="Sign out"><LogOut size={15} /></button></form>
          </div>
        </div>
      </aside>
      <main className="main-panel">
        <MobileNavigation profile={profile} />
        <header className="topbar">
          <div className="topbar-location"><span>JMSC</span><i>/</i><b>STUDIO OPERATIONS</b></div>
          <div className="topbar-right">
            <span className="secure-tag"><i /> PRIVATE TEAM SPACE</span>
            <span className="topbar-avatar">{profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JM"}</span>
          </div>
        </header>
        <section className="content-area">{children}</section>
        <footer className="main-footer"><span>JMSC MEDIA WORKS · DAVAO REGION</span><span>Keep creating.</span></footer>
      </main>
    </div>
  );
}

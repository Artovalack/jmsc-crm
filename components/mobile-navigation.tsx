"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, Archive, BriefcaseBusiness, Building2, ClipboardList, FileCheck2, Handshake,
  LayoutDashboard, LogOut, Menu, Settings2, Users, Workflow, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Profile } from "@/types/database";
import { signOut } from "@/app/actions";
import { initials } from "@/lib/format";
import NavigationLinkStatus from "@/components/navigation-link-status";

const studioLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Workflow },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/catalog", label: "Service catalog", icon: Archive },
  { href: "/orders", label: "Orders & projects", icon: ClipboardList },
  { href: "/tasks", label: "Tasks", icon: Activity },
];

const operationsLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/proofs", label: "Proofs & revisions", icon: FileCheck2 },
  { href: "/partners", label: "Print partners", icon: Handshake },
  { href: "/b2b", label: "B2B pipeline", icon: Building2 },
  { href: "/quotations", label: "Quotations", icon: BriefcaseBusiness },
  { href: "/settings", label: "Team settings", icon: Settings2 },
];

function NavigationLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <NavigationLinkStatus label={label} Icon={Icon} />
      <span>{label}</span>
    </Link>
  );
}

export default function MobileNavigation({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const canSeeQuotes = ["admin", "client_relations", "finance"].includes(profile.role);
  const links = operationsLinks.filter(({ href }) =>
    (href !== "/quotations" || canSeeQuotes) && (href !== "/settings" || profile.role === "admin"),
  );
  const close = () => setOpen(false);

  return (
    <div className="mobile-navigation">
      <div className="mobile-nav-bar">
        <Link className="mobile-brand" href="/dashboard" onClick={close}>
          <Image className="brand-logo brand-logo-mobile" src="/jmsc-logo.png" alt="" width={36} height={40} priority />
          <span><strong>JMSC CRM</strong></span>
        </Link>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      <nav className="mobile-menu" id="mobile-primary-navigation" aria-label="Primary navigation" hidden={!open}>
        <p className="mobile-menu-label">WORKSPACE</p>
        {studioLinks.map((item) => <NavigationLink {...item} key={item.href} onNavigate={close} />)}
        <p className="mobile-menu-label">HANDOFFS & GROWTH</p>
        {links.map((item) => <NavigationLink {...item} key={item.href} onNavigate={close} />)}
        <div className="mobile-menu-account">
          <span className="member-avatar">{initials(profile.full_name)}</span>
          <span className="member-copy"><b>{profile.full_name || "Team member"}</b><small>{profile.role.replace("_", " ")}</small></span>
          <form action={signOut}><button className="icon-quiet" type="submit" aria-label="Sign out"><LogOut size={17} /></button></form>
        </div>
      </nav>
    </div>
  );
}

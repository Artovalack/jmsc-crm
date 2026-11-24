"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Archive, BriefcaseBusiness, Building2, ClipboardList, FileCheck2, Handshake,
  LayoutDashboard, Settings2, Users, Workflow,
} from "lucide-react";
import SidebarTooltip from "@/components/sidebar-tooltip";
import NavigationLinkStatus from "@/components/navigation-link-status";

const icons = {
  overview: LayoutDashboard,
  leads: Workflow,
  clients: Users,
  catalog: Archive,
  orders: ClipboardList,
  tasks: Activity,
  proofs: FileCheck2,
  partners: Handshake,
  b2b: Building2,
  quotations: BriefcaseBusiness,
  settings: Settings2,
};

type NavIcon = keyof typeof icons;

export default function NavItem({ href, label, icon, collapsed = false }: { href: string; label: string; icon: NavIcon; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[icon];
  return (
    <SidebarTooltip label={label} enabled={collapsed}>
      <Link href={href} className={`nav-item ${active ? "nav-item-active" : ""}`} aria-label={label} aria-current={active ? "page" : undefined}>
        <NavigationLinkStatus label={label} Icon={Icon} />
        <span>{label}</span>
      </Link>
    </SidebarTooltip>
  );
}

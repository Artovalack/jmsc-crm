"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export default function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`nav-item ${active ? "nav-item-active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

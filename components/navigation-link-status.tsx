"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function NavigationLinkStatus({
  label,
  Icon,
}: {
  label: string;
  Icon: LucideIcon;
}) {
  const { pending } = useLinkStatus();

  return pending ? (
    <>
      <LoaderCircle className="navigation-spinner" size={17} strokeWidth={1.8} aria-hidden="true" />
      <span className="sr-only" role="status">Loading {label}</span>
    </>
  ) : (
    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
  );
}

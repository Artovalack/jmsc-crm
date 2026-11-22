"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function SidebarTooltip({
  label,
  children,
  enabled = true,
}: {
  label: string;
  children: ReactNode;
  enabled?: boolean;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.top + rect.height / 2, left: rect.right + 12 });
  }, []);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition, visible]);

  const show = () => {
    if (!enabled) return;
    updatePosition();
    setVisible(true);
  };

  return (
    <>
      <span
        className="sidebar-tooltip-anchor"
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        onFocusCapture={show}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setVisible(false);
        }}
      >
        {children}
      </span>
      {visible && typeof document !== "undefined" && createPortal(
        <span className="sidebar-tooltip" id={id} role="tooltip" style={{ top: position.top, left: position.left }}>
          {label}
        </span>,
        document.body,
      )}
    </>
  );
}

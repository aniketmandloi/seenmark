"use client";

import type { Route } from "next";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * One yellow pill slides to the link under the pointer or keyboard focus, and back to the
 * current page's link when they leave. With no link to rest on, it fades out.
 */
export default function NavPills({
  links,
  current,
}: {
  links: { href: Route; label: string }[];
  current: Route | undefined;
}) {
  const [pointed, setPointed] = useState<Route | null>(null);
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const target = pointed ?? current;

  useLayoutEffect(() => {
    const navElement = nav.current;
    const pillElement = pill.current;
    if (!navElement || !pillElement) return;

    const place = () => {
      const link = target ? navElement.querySelector<HTMLElement>(`[data-href="${target}"]`) : null;
      if (!link) {
        pillElement.style.opacity = "0";
        return;
      }
      // A hidden pill appears where it is needed instead of sliding over from its last link.
      const hidden = pillElement.style.opacity !== "1";
      if (hidden) pillElement.style.transitionProperty = "opacity";
      pillElement.style.translate = `${link.offsetLeft}px 0`;
      pillElement.style.width = `${link.offsetWidth}px`;
      if (hidden) {
        void pillElement.offsetWidth;
        pillElement.style.transitionProperty = "";
      }
      pillElement.style.opacity = "1";
    };

    // Also fires once on observe. Links change width when the web font arrives.
    const observer = new ResizeObserver(place);
    observer.observe(navElement);
    return () => observer.disconnect();
  }, [target]);

  return (
    <nav
      ref={nav}
      aria-label="Main navigation"
      onPointerLeave={() => setPointed(null)}
      className="relative hidden items-center rounded-full border border-border bg-card p-1 lg:flex"
    >
      <span
        ref={pill}
        aria-hidden="true"
        className="absolute inset-y-1 left-0 rounded-full bg-primary opacity-0 shadow-glow transition-[translate,width,opacity] duration-300 ease-out-soft"
      />
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          data-href={link.href}
          aria-current={link.href === current ? "page" : undefined}
          onPointerEnter={() => setPointed(link.href)}
          onFocus={() => setPointed(link.href)}
          onBlur={() => setPointed(null)}
          className={`relative rounded-full px-4 py-2 font-medium text-[15px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            link.href === target ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

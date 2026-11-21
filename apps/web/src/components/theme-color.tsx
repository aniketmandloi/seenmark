"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

// The --background tokens, as in the layout's viewport themeColor.
const colors = { light: "#F1F2F5", dark: "#121215" };

/**
 * The layout's theme-color tags follow the OS scheme. A member who picks Light or Dark by hand
 * gets browser chrome that matches the page instead.
 */
export default function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", colors[resolvedTheme]);
    }
  }, [resolvedTheme]);

  return null;
}

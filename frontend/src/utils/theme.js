export function applyTheme(theme) {
  const root = document.documentElement;

  // Header
  root.style.setProperty(
    "--color-background-upper",
    theme["color-background-upper"] || "#15803d"
  );
  root.style.setProperty(
    "--color-text-color-upper",
    theme["color-text-color-upper"] || "#1e293b"
  );

  // SideBar
  root.style.setProperty(
    "--color-background-sidebar",
    theme["color-background-sidebar"] || "#15803d"
  );
  root.style.setProperty(
    "--color-text-color-sidebar-pr",
    theme["color-text-color-sidebar-pr"] || "#1e293b"
  );
  root.style.setProperty(
    "--color-text-color-sidebar-sec",
    theme["color-text-color-sidebar-sec"] || "#f3f4f6"
  );
  root.style.setProperty(
    "--color-hover-bg",
    theme["color-hover-bg"] ||
      "color-mix(in srgb, var(--color-background-sidebar), black 3%)"
  );
  root.style.setProperty(
    "--color-hover-text",
    theme["color-hover-text"] ||
      "color-mix(in srgb, var(--color-text-color-sidebar-sec), black 20%)"
  );

  // Page
  root.style.setProperty(
    "--color-background-page",
    theme["color-background-page"] || "#f9fafb"
  );
  root.style.setProperty(
    "--color-text-color-page",
    theme["color-text-color-page"] || "#111827"
  );
}
/**
 * Slow gradient-drift decoration behind the dashboard content
 * (docs/ui-ux/DESIGN_SYSTEM.md "Futuristic dashboard layout"). Pure CSS
 * animation so it's frozen for free by the global prefers-reduced-motion
 * rule in styles/tokens.css, with no JS animation loop to manage.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="ambient-blob left-[8%] top-[-10%] size-96 bg-accent-primary"
        style={{ animation: 'ambient-drift-a 70s ease-in-out infinite' }}
      />
      <div
        className="ambient-blob right-[4%] top-[20%] size-80 bg-accent-success"
        style={{ animation: 'ambient-drift-b 85s ease-in-out infinite' }}
      />
      <div
        className="ambient-blob bottom-[-15%] left-[30%] size-96 bg-accent-primary"
        style={{ animation: 'ambient-drift-a 95s ease-in-out infinite reverse' }}
      />
    </div>
  )
}

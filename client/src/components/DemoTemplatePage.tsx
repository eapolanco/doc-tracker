/**
 * DemoTemplatePage - Example page matching the shadcn/ui template layout
 *
 * This demonstrates the recommended content structure:
 * - Grid of cards at the top (3 columns on desktop)
 * - Large content area below
 * - Proper spacing and responsive design
 */
export default function DemoTemplatePage() {
  return (
    <>
      {/* Grid of cards - 3 columns on desktop, auto-rows for consistent height */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>

      {/* Main content area - flexible height */}
      <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </>
  );
}

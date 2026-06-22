export function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
      {/* Light mode orbs */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-300/20 blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[400px] rounded-full bg-indigo-300/15 blur-[100px] animate-[float_30s_ease-in-out_infinite_2s]" />
      </div>
      {/* Dark mode orbs */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/25 blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[400px] rounded-full bg-indigo-700/20 blur-[100px] animate-[float_30s_ease-in-out_infinite_2s]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise grain — fixed, pointer-events-none, mobile-safe */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.015] dark:opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

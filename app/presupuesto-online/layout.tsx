export default function PresupuestoPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Layout público aislado: sin sidebar, sin login obligatorio y sin chat interno */}
      {children}
    </div>
  );
}
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="bg-glow" />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}

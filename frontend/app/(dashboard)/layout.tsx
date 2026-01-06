import { Header } from "@/components/shared/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}

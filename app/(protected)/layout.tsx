import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DockNav } from "@/components/dock-nav";
import { DataProvider } from "@/components/data/DataProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <DockNav />
        </div>
      </DataProvider>
    </ProtectedRoute>
  );
}


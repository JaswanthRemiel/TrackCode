import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dock } from "@/components/dock";
import { DataProvider } from "@/components/data/DataProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <div className="min-h-screen bg-background transition-colors duration-300">
          <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-28">
            {children}
          </main>
          <Dock />
        </div>
      </DataProvider>
    </ProtectedRoute>
  );
}

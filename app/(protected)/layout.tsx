import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dock } from "@/components/dock";
import { DataProvider } from "@/components/data/DataProvider";
import { UserStatsSync } from "@/components/user-stats-sync";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <UserStatsSync />
        <div className="min-h-screen bg-background transition-colors duration-300 md:pl-20 pl-0">
          <main className="w-full p-4 sm:p-6 lg:p-8 pb-28">
            {children}
          </main>
          <Dock />
        </div>
      </DataProvider>
    </ProtectedRoute>
  );
}

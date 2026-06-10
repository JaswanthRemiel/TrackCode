import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/sidebar";
import { DataProvider } from "@/components/data/DataProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col md:flex-row">
          <Sidebar />
          <div className="flex-1 flex flex-col md:pl-64">
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </DataProvider>
    </ProtectedRoute>
  );
}


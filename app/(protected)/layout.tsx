import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { DataProvider } from "@/components/data/DataProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <ProtectedRoute>
        <DataProvider>
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </DataProvider>
      </ProtectedRoute>
    </div>
  );
}

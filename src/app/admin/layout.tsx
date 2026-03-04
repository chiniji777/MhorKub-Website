import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";

export const metadata = {
  title: "Admin — MhorKub",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isLoggedIn = session?.value === process.env.ADMIN_SECRET;

  // Allow login page without auth
  return (
    <div className="min-h-screen bg-background">
      {isLoggedIn ? (
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

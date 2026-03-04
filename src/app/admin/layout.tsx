import { auth } from "@/auth";
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
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-background">
      {isLoggedIn ? (
        <div className="flex min-h-screen">
          <AdminSidebar user={session.user!} />
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

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "./login-form";

export default async function AdminLoginPage() {
  const session = await auth();

  // Already logged in → redirect to admin dashboard
  if (session?.user) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}

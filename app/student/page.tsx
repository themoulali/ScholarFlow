import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);

  // Verify the user is logged in.
  if (!session?.user) {
    redirect("/login");
  }

  // Only students can access this page.
  if (session.user.role !== "STUDENT") {
    const roleHome =
      session.user.role === "INSTRUCTOR"
        ? "/instructor"
        : "/admin";

    redirect(roleHome);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to ScholarFlow!
        </h1>

        <div className="mt-6">
          <LogoutButton />
        </div>

        <p className="mt-3 text-gray-600">
          Hello, {session.user.name || "Student"}.
        </p>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Student Dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Your learning journey starts here. You will be able to explore
            courses, enroll in learning programs, and track your progress.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Account: {session.user.email}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Role: {session.user.role}
          </p>
        </section>
      </div>
    </main>
  );
}
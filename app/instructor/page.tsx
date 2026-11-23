import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import CourseManagement from "@/components/instructor/course-management";

export default async function InstructorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "INSTRUCTOR") {
    const roleHome =
      session.user.role === "STUDENT" ? "/student" : "/admin";

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
          Hello, {session.user.name || "Instructor"}.
        </p>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Instructor Dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Manage your courses, create learning materials, and support
            your students from here.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Account: {session.user.email}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Role: {session.user.role}
          </p>
        </section>

        <CourseManagement />
      </div>
    </main>
  );
}
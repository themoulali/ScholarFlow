
"use client";

import { useCallback, useEffect, useState } from "react";

type AdminStats = {
  users: {
    total: number;
    students: number;
    instructors: number;
    admins: number;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  assignments: {
    total: number;
    published: number;
  };
  submissions: {
    total: number;
    submitted: number;
    graded: number;
  };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard statistics.");
      }

      setStats(data.stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading statistics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = stats
    ? [
        {
          title: "Total Users",
          value: stats.users.total,
          description: `${stats.users.students} students · ${stats.users.instructors} instructors`,
        },
        {
          title: "Total Courses",
          value: stats.courses.total,
          description: `${stats.courses.published} published · ${stats.courses.draft} drafts`,
        },
        {
          title: "Total Enrollments",
          value: stats.enrollments.total,
          description: `${stats.enrollments.active} active · ${stats.enrollments.completed} completed`,
        },
        {
          title: "Total Assignments",
          value: stats.assignments.total,
          description: `${stats.assignments.published} published`,
        },
        {
          title: "Total Submissions",
          value: stats.submissions.total,
          description: `${stats.submissions.submitted} submitted · ${stats.submissions.graded} graded`,
        },
        {
          title: "Administrators",
          value: stats.users.admins,
          description: `${stats.users.total} registered users overall`,
        },
      ]
    : [];

  return (
    <section className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Platform Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor users, courses, enrollments and assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Statistics"}
        </button>
      </div>

      {loading && (
        <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          Loading platform statistics...
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {stats && !loading && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-medium text-gray-500">
                  {card.title}
                </h3>

                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Course Statistics
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <p className="flex justify-between">
                  Published courses
                  <strong>{stats.courses.published}</strong>
                </p>
                <p className="flex justify-between">
                  Draft courses
                  <strong>{stats.courses.draft}</strong>
                </p>
                <p className="flex justify-between">
                  Archived courses
                  <strong>{stats.courses.archived}</strong>
                </p>
              </div>
            </section>

            <section className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Enrollment Statistics
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <p className="flex justify-between">
                  Active enrollments
                  <strong>{stats.enrollments.active}</strong>
                </p>
                <p className="flex justify-between">
                  Completed enrollments
                  <strong>{stats.enrollments.completed}</strong>
                </p>
                <p className="flex justify-between">
                  Cancelled enrollments
                  <strong>{stats.enrollments.cancelled}</strong>
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

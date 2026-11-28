
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type EnrolledCourse = {
  id: string;
  status: "ACTIVE" | "COMPLETED";
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    instructor: {
      name: string | null;
    };
    sections: {
      id: string;
      title: string;
      order: number;
    }[];
  };
  totalSections: number;
  completedSections: number;
  progressPercentage: number;
  completedSectionIds: string[];
};

export default function EnrolledCourses() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [updatingSectionId, setUpdatingSectionId] = useState("");

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/student/enrollments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load enrolled courses.");
      }

      setCourses(data.courses || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleUnenroll = async (courseId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to unenroll from this course?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(courseId);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/courses/${courseId}/enrollment`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to unenroll.");
      }

      setMessage(data.message || "Successfully unenrolled.");
      await fetchEnrollments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setRemovingId("");
    }
  };

  const handleSectionProgress = async (
    enrollmentId: string,
    sectionId: string,
    completed: boolean
  ) => {
    try {
      setUpdatingSectionId(sectionId);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/student/enrollments/${enrollmentId}/progress`,
        {
          method: completed ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sectionId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update section progress.");
      }

      setMessage(data.message);
      await fetchEnrollments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingSectionId("");
    }
  };

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="text-2xl font-bold">My Learning</h2>
        <p className="mt-4 text-gray-500">Loading your courses...</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Learning</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your enrolled courses and learning progress.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">
            No enrolled courses yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Explore the course catalog and enroll in a course to start learning.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((item) => {
            const isCompleted = item.status === "COMPLETED";

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                {item.course.thumbnailUrl ? (
                  <div className="relative h-44 w-full">
                    <Image
                      src={item.course.thumbnailUrl}
                      alt={item.course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100 text-4xl font-bold text-gray-400">
                    {item.course.title.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {item.course.category}
                    </span>

                    {isCompleted && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        ✓ Course Completed
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.course.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Instructor: {item.course.instructor.name || "Instructor"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    {item.course.description}
                  </p>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        Learning Progress
                      </span>
                      <span className="font-semibold text-gray-900">
                        {item.progressPercentage}%
                      </span>
                    </div>

                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
                      role="progressbar"
                      aria-valuenow={item.progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Course progress"
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${item.progressPercentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.completedSections} of {item.totalSections} sections completed
                    </p>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-gray-800">
                      Course Sections
                    </h4>

                    {item.course.sections.map((section) => {
                      const completed = item.completedSectionIds.includes(
                        section.id
                      );

                      const updating = updatingSectionId === section.id;

                      return (
                        <div
                          key={section.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className={completed ? "text-green-600" : "text-gray-400"}>
                              {completed ? "✓" : "○"}
                            </span>
                            <span className="text-sm text-gray-700">
                              {section.order + 1}. {section.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleSectionProgress(
                                item.id,
                                section.id,
                                completed
                              )
                            }
                            disabled={Boolean(updatingSectionId)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                              completed
                                ? "border border-gray-300 text-gray-600 hover:bg-gray-100"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {updating
                              ? "Updating..."
                              : completed
                                ? "Mark Incomplete"
                                : "Mark Complete"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <span className="text-xs text-gray-500">
                      Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
                    </span>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUnenroll(item.course.id)}
                        disabled={Boolean(removingId) || Boolean(updatingSectionId)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {removingId === item.course.id
                          ? "Unenrolling..."
                          : "Unenroll"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

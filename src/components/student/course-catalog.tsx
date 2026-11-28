
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  instructor: {
    name: string;
  };
  _count: {
    sections: number;
    enrollments: number;
  };
};

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (category !== "ALL") {
          params.set("category", category);
        }

        const response = await fetch(
          `/api/student/courses?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load courses.");
        }

        setCourses(data.courses || []);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => controller.abort();
  }, [search, category]);

  async function handleEnroll(courseId: string) {
    try {
      setEnrollingCourseId(courseId);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/courses/${courseId}/enrollment`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Enrollment failed.");
      }

      setMessage(data.message || "Successfully enrolled!");

      setCourses((previous) =>
        previous.map((course) =>
          course.id === courseId
            ? {
                ...course,
                _count: {
                  ...course._count,
                  enrollments: course._count.enrollments + 1,
                },
              }
            : course
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enrollment failed."
      );
    } finally {
      setEnrollingCourseId("");
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Explore Courses
        </h2>
        <p className="mt-2 text-gray-600">
          Discover courses and start learning.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search courses by title..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Categories</option>
          <option value="Programming">Programming</option>
          <option value="Web Development">Web Development</option>
          <option value="Data Science">Data Science</option>
          <option value="Artificial Intelligence">
            Artificial Intelligence
          </option>
          <option value="Database">Database</option>
          <option value="Other">Other</option>
          <option value="General">General</option>
        </select>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-green-50 p-4 text-green-700">
          {message}
        </p>
      )}

      {loading && (
        <p className="py-8 text-center text-gray-600">
          Loading courses...
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h3 className="font-semibold text-gray-800">
            No courses found
          </h3>
          <p className="mt-2 text-gray-600">
            Try another search term or category.
          </p>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <>
          <p className="mb-4 text-sm text-gray-600">
            {courses.length} course(s) found
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {course.thumbnailUrl ? (
                  <div className="relative h-44 w-full">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-blue-50 text-4xl font-bold text-blue-600">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="p-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {course.category}
                  </span>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {course.description}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>Instructor: {course.instructor.name}</p>
                    <p>Sections: {course._count.sections}</p>
                    <p>
                      Students enrolled: {course._count.enrollments}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingCourseId === course.id}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {enrollingCourseId === course.id
                      ? "Enrolling..."
                      : "Enroll Now"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

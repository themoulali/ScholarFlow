"use client";

import { useEffect, useState, type FormEvent } from "react";
import SectionManagement from "./section-management";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

type CourseForm = {
  title: string;
  description: string;
  thumbnailUrl: string;
};

const initialForm: CourseForm = {
  title: "",
  description: "",
  thumbnailUrl: "",
};

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(initialForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load courses.");
      }

      setCourses(data.courses || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  function handleInputChange(
    field: keyof CourseForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function startEditing(course: Course) {
    setEditingCourse(course);

    setForm({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl || "",
    });

    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingCourse(null);
    setForm(initialForm);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const isEditing = Boolean(editingCourse);

      const url = isEditing
        ? `/api/courses/${editingCourse!.id}`
        : "/api/courses";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          thumbnailUrl: form.thumbnailUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save course.");
      }

      if (isEditing) {
        setCourses((previous) =>
          previous.map((course) =>
            course.id === data.course.id ? data.course : course
          )
        );

        setMessage("Course updated successfully.");
      } else {
        setCourses((previous) => [data.course, ...previous]);
        setMessage("Course created successfully.");
      }

      setForm(initialForm);
      setEditingCourse(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete course.");
      }

      setCourses((previous) =>
        previous.filter((item) => item.id !== course.id)
      );

      setMessage("Course deleted successfully.");

      if (editingCourse?.id === course.id) {
        cancelEditing();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  return (
    <section className="mt-8 space-y-8">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          {editingCourse ? "Edit Course" : "Create a New Course"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="course-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Course Title
            </label>

            <input
              id="course-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={form.title}
              onChange={(event) =>
                handleInputChange("title", event.target.value)
              }
              placeholder="Enter course title"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="course-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Course Description
            </label>

            <textarea
              id="course-description"
              required
              maxLength={5000}
              rows={4}
              value={form.description}
              onChange={(event) =>
                handleInputChange("description", event.target.value)
              }
              placeholder="Describe what students will learn..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="course-thumbnail"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Thumbnail URL (Optional)
            </label>

            <input
              id="course-thumbnail"
              type="url"
              value={form.thumbnailUrl}
              onChange={(event) =>
                handleInputChange("thumbnailUrl", event.target.value)
              }
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingCourse
                  ? "Update Course"
                  : "Create Course"}
            </button>

            {editingCourse && (
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            My Courses
          </h2>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {courses.length} Courses
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading your courses...</p>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center">
            <p className="font-medium text-gray-700">
              You haven&apos;t created any courses yet.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Use the form above to create your first course.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {courses.map((course) => (
              <article
                key={course.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={`${course.title} thumbnail`}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {course.title}
                    </h3>

                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {course.status}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                    {course.description}
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    Created:{" "}
                    {new Date(course.createdAt).toLocaleDateString()}
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(course)}
                      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(course)}
                      className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                  <SectionManagement courseId={course.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

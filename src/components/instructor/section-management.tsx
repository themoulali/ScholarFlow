
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import LessonEditor from "./lesson-editor";
import QuizBuilder from "./quiz-builder";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number;
};

type Section = {
  id: string;
  title: string;
  description: string | null;
  order: number;
};

type SectionManagementProps = {
  courseId: string;
};

export default function SectionManagement({
  courseId,
}: SectionManagementProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [sectionTitle, setSectionTitle] = useState("");
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>(
    {}
  );
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activePanel, setActivePanel] = useState<"editor" | "quiz" | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

    const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/courses/${courseId}/sections`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load sections.");
      }

      setSections(data.sections || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load sections."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

   useEffect(() => {
    void loadSections();
  }, [loadSections]);

  async function loadLessons(sectionId: string) {
    try {
      setError("");

      const response = await fetch(
        `/api/sections/${sectionId}/lessons`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load lessons.");
      }

      setLessons((previous) => ({
        ...previous,
        [sectionId]: data.lessons || [],
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load lessons."
      );
    }
  }

  async function handleCreateSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sectionTitle.trim().length < 2) {
      setError("Section title must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/courses/${courseId}/sections`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sectionTitle.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create section.");
      }

      setSections((previous) => [...previous, data.section]);
      setSectionTitle("");
      setMessage("Section created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create section."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLesson(
    event: FormEvent<HTMLFormElement>,
    sectionId: string
  ) {
    event.preventDefault();

    const title = (lessonTitles[sectionId] || "").trim();

    if (title.length < 2) {
      setError("Lesson title must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/sections/${sectionId}/lessons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create lesson.");
      }

      setLessons((previous) => ({
        ...previous,
        [sectionId]: [...(previous[sectionId] || []), data.lesson],
      }));

      setLessonTitles((previous) => ({
        ...previous,
        [sectionId]: "",
      }));

      setMessage("Lesson created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create lesson."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSection(sectionId: string) {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
      return;
    }

    setExpandedSection(sectionId);
    setActiveLesson(null);

    if (lessons[sectionId] === undefined) {
      await loadLessons(sectionId);
    }
  }

  return (
    <div className="mt-6 border-t pt-5">
      <h4 className="text-base font-semibold text-gray-800">
        Course Content
      </h4>

      {message && (
        <p className="mt-3 text-sm text-green-700">{message}</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <form
        onSubmit={handleCreateSection}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={sectionTitle}
          onChange={(event) => setSectionTitle(event.target.value)}
          placeholder="Enter a new section title"
          maxLength={150}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add Section
        </button>
      </form>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading sections...</p>
      ) : sections.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No sections yet. Create your first section above.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-gray-200 p-3"
            >
              <button
                type="button"
                onClick={() => void toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="font-medium text-gray-800">
                  {section.title}
                </span>
                <span className="text-sm text-blue-600">
                  {expandedSection === section.id ? "Hide" : "Manage"}
                </span>
              </button>

              {expandedSection === section.id && (
                <div className="mt-4 border-t pt-4">
                  <form
                    onSubmit={(event) =>
                      void handleCreateLesson(event, section.id)
                    }
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <input
                      type="text"
                      value={lessonTitles[section.id] || ""}
                      onChange={(event) =>
                        setLessonTitles((previous) => ({
                          ...previous,
                          [section.id]: event.target.value,
                        }))
                      }
                      placeholder="Enter a lesson title"
                      maxLength={150}
                      className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                      required
                    />

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Add Lesson
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {(lessons[section.id] || []).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 p-3"
                      >
                        <span className="text-sm text-gray-700">
                          {lesson.title}
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLesson(lesson);
                              setActivePanel("editor");
                            }}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            Open Editor
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveLesson(lesson);
                              setActivePanel("quiz");
                            }}
                            className="text-sm font-medium text-purple-600 hover:underline"
                          >
                            Manage Quiz
                          </button>
                        </div>
                      </div>
                    ))}

                    {(lessons[section.id] || []).length === 0 && (
                      <p className="text-sm text-gray-500">
                        No lessons in this section yet.
                      </p>
                    )}
                  </div>

                  {activeLesson &&
                    (lessons[section.id] || []).some(
                      (lesson) => lesson.id === activeLesson.id
                    ) && (
                      <div className="mt-5 rounded-lg border p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-semibold text-gray-800">
                            {activePanel === "quiz" ? "Quiz:" : "Editing:"}{" "}
                            {activeLesson.title}
                          </h5>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveLesson(null);
                              setActivePanel(null);
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Close
                          </button>
                        </div>

                        {activePanel === "editor" && (
                          <LessonEditor lessonId={activeLesson.id} />
                        )}

                        {activePanel === "quiz" && (
                          <QuizBuilder lessonId={activeLesson.id} />
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

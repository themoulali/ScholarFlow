
"use client";

import { FormEvent, useEffect, useState } from "react";

type EnrolledCourse = {
  id: string;
  course: {
    id: string;
    title: string;
  };
};

type ChatMessage = {
  id: number;
  role: "student" | "assistant";
  content: string;
};

export default function AILearningAssistant() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch("/api/student/enrollments");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your courses.");
        }

        const enrolledCourses: EnrolledCourse[] = data.courses || [];
        setCourses(enrolledCourses);

        if (enrolledCourses.length > 0) {
          setCourseId(enrolledCourses[0].course.id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load courses."
        );
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!courseId) {
      setError("Please enroll in a course before using the AI assistant.");
      return;
    }

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (trimmedQuestion.length > 1000) {
      setError("Your question must be 1000 characters or fewer.");
      return;
    }

    const studentMessage: ChatMessage = {
      id: Date.now(),
      role: "student",
      content: trimmedQuestion,
    };

    setMessages((previous) => [...previous, studentMessage]);
    setQuestion("");
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an AI response.");
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-10 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          AI Learning Assistant
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Ask questions and get explanations based on your enrolled course
          materials.
        </p>
      </div>

      <div className="mt-6">
        <label
          htmlFor="ai-course"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Select a course
        </label>

        <select
          id="ai-course"
          value={courseId}
          onChange={(event) => {
            setCourseId(event.target.value);
            setMessages([]);
            setError("");
          }}
          disabled={loadingCourses || courses.length === 0 || sending}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        >
          {loadingCourses ? (
            <option value="">Loading courses...</option>
          ) : courses.length === 0 ? (
            <option value="">No enrolled courses</option>
          ) : (
            courses.map((item) => (
              <option key={item.course.id} value={item.course.id}>
                {item.course.title}
              </option>
            ))
          )}
        </select>
      </div>

      <div
        className="mt-6 min-h-56 max-h-[450px] space-y-4 overflow-y-auto rounded-lg border bg-gray-50 p-4"
        aria-live="polite"
        aria-label="AI conversation"
      >
        {messages.length === 0 && (
          <div className="flex min-h-48 items-center justify-center text-center">
            <div>
              <p className="font-semibold text-gray-700">
                How can I help you learn?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Select a course and ask a question about its lessons.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "student" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm ${
                message.role === "student"
                  ? "bg-blue-600 text-white"
                  : "border bg-white text-gray-800"
              }`}
            >
              <p className="mb-1 text-xs font-semibold opacity-75">
                {message.role === "student" ? "You" : "ScholarFlow AI"}
              </p>
              {message.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="text-sm text-gray-500" role="status">
            ScholarFlow AI is preparing your answer...
          </div>
        )}
      </div>

      {error && (
        <p
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask something about your course..."
          maxLength={1000}
          disabled={loadingCourses || courses.length === 0 || sending}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        <button
          type="submit"
          disabled={
            loadingCourses ||
            courses.length === 0 ||
            sending ||
            !question.trim()
          }
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Thinking..." : "Send"}
        </button>
      </form>

      <p className="mt-2 text-xs text-gray-500">
        Answers are generated using the selected course&apos;s available learning
      </p>
    </section>
  );
}

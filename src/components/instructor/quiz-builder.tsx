
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type QuizOption = {
  text: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  question: string;
  type: "MCQ" | "TRUE_FALSE";
  options: QuizOption[];
};

type QuizData = {
  title: string;
  description: string;
  questions: QuizQuestion[];
};

type QuizBuilderProps = {
  lessonId: string;
};

const createMCQ = (): QuizQuestion => ({
  question: "",
  type: "MCQ",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

const createTrueFalse = (): QuizQuestion => ({
  question: "",
  type: "TRUE_FALSE",
  options: [
    { text: "True", isCorrect: true },
    { text: "False", isCorrect: false },
  ],
});

export default function QuizBuilder({ lessonId }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<QuizData>({
    title: "",
    description: "",
    questions: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/lessons/${lessonId}/quiz`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load quiz.");
      }

      if (data.quiz) {
        setQuiz({
          title: data.quiz.title || "",
          description: data.quiz.description || "",
          questions: (data.quiz.questions || []).map(
            (question: QuizQuestion) => ({
              question: question.question,
              type: question.type,
              options: question.options.map((option: QuizOption) => ({
                text: option.text,
                isCorrect: option.isCorrect,
              })),
            })
          ),
        });
      } else {
        setQuiz({
          title: "",
          description: "",
          questions: [],
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load quiz."
      );
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  function updateQuestion(
    questionIndex: number,
    updates: Partial<QuizQuestion>
  ) {
    setQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, ...updates }
          : question
      ),
    }));
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    updates: Partial<QuizOption>
  ) {
    setQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) => {
        if (index !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, currentIndex) => {
            if (currentIndex === optionIndex) {
              return { ...option, ...updates };
            }

            if (updates.isCorrect === true) {
              return { ...option, isCorrect: false };
            }

            return option;
          }),
        };
      }),
    }));
  }

  function addQuestion(type: "MCQ" | "TRUE_FALSE") {
    if (quiz.questions.length >= 50) {
      setError("A quiz cannot contain more than 50 questions.");
      return;
    }

    setError("");
    setQuiz((previous) => ({
      ...previous,
      questions: [
        ...previous.questions,
        type === "MCQ" ? createMCQ() : createTrueFalse(),
      ],
    }));
  }

  function removeQuestion(questionIndex: number) {
    setQuiz((previous) => ({
      ...previous,
      questions: previous.questions.filter(
        (_, index) => index !== questionIndex
      ),
    }));
  }

  function addOption(questionIndex: number) {
    setQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) => {
        if (index !== questionIndex) return question;

        if (question.options.length >= 6) return question;

        return {
          ...question,
          options: [
            ...question.options,
            { text: "", isCorrect: false },
          ],
        };
      }),
    }));
  }

  function removeOption(
    questionIndex: number,
    optionIndex: number
  ) {
    setQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) => {
        if (index !== questionIndex) return question;

        if (question.options.length <= 2) return question;

        const options = question.options.filter(
          (_, currentIndex) => currentIndex !== optionIndex
        );

        if (!options.some((option) => option.isCorrect)) {
          options[0] = { ...options[0], isCorrect: true };
        }

        return { ...question, options };
      }),
    }));
  }

  function changeQuestionType(
    questionIndex: number,
    type: "MCQ" | "TRUE_FALSE"
  ) {
    updateQuestion(questionIndex, {
      type,
      options: type === "MCQ"
        ? createMCQ().options
        : createTrueFalse().options,
    });
  }

  async function handleSaveQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (quiz.title.trim().length < 2) {
      setError("Quiz title must contain at least 2 characters.");
      return;
    }

    if (quiz.questions.length === 0) {
      setError("Add at least one question before saving.");
      return;
    }

    for (let index = 0; index < quiz.questions.length; index++) {
      const question = quiz.questions[index];

      if (question.question.trim().length < 3) {
        setError(`Question ${index + 1} must contain at least 3 characters.`);
        return;
      }

      if (question.options.some((option) => !option.text.trim())) {
        setError(`Please complete every option in question ${index + 1}.`);
        return;
      }

      if (question.options.filter((option) => option.isCorrect).length !== 1) {
        setError(`Select exactly one correct answer for question ${index + 1}.`);
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: quiz.title.trim(),
          description: quiz.description.trim(),
          questions: quiz.questions.map((question) => ({
            question: question.question.trim(),
            type: question.type,
            options: question.options.map((option) => ({
              text: option.text.trim(),
              isCorrect: option.isCorrect,
            })),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save quiz.");
      }

      setMessage("Quiz saved successfully.");
      await loadQuiz();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save quiz."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="py-4 text-sm text-gray-500">
        Loading quiz...
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-gray-200 p-4">
      <h5 className="text-lg font-semibold text-gray-800">
        Quiz Builder
      </h5>

      <p className="mt-1 text-sm text-gray-500">
        Create multiple-choice and true/false questions for this lesson.
      </p>

      {message && (
        <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSaveQuiz} className="mt-4 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Quiz Title
          </label>

          <input
            type="text"
            value={quiz.title}
            onChange={(event) =>
              setQuiz((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="Enter quiz title"
            maxLength={150}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={quiz.description}
            onChange={(event) =>
              setQuiz((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Optional quiz description"
            maxLength={2000}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addQuestion("MCQ")}
            disabled={quiz.questions.length >= 50}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Add MCQ
          </button>

          <button
            type="button"
            onClick={() => addQuestion("TRUE_FALSE")}
            disabled={quiz.questions.length >= 50}
            className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            + Add True/False
          </button>
        </div>

        {quiz.questions.length === 0 && (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No questions yet. Use the buttons above to add your first question.
          </p>
        )}

        {quiz.questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            className="space-y-4 rounded-lg border border-gray-200 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h6 className="font-semibold text-gray-800">
                Question {questionIndex + 1}
              </h6>

              <button
                type="button"
                onClick={() => removeQuestion(questionIndex)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remove Question
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Question Type
              </label>

              <select
                value={question.type}
                onChange={(event) =>
                  changeQuestionType(
                    questionIndex,
                    event.target.value as "MCQ" | "TRUE_FALSE"
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Question
              </label>

              <textarea
                value={question.question}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    question: event.target.value,
                  })
                }
                placeholder="Enter your question"
                maxLength={1000}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Options — select the correct answer
              </p>

              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={`${questionIndex}-${optionIndex}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={option.isCorrect}
                      onChange={() =>
                        updateOption(questionIndex, optionIndex, {
                          isCorrect: true,
                        })
                      }
                      aria-label={`Mark option ${optionIndex + 1} as correct`}
                    />

                    <input
                      type="text"
                      value={option.text}
                      onChange={(event) =>
                        updateOption(questionIndex, optionIndex, {
                          text: event.target.value,
                        })
                      }
                      readOnly={question.type === "TRUE_FALSE"}
                      placeholder={`Option ${optionIndex + 1}`}
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm read-only:bg-gray-100"
                      required
                    />

                    {question.type === "MCQ" && (
                      <button
                        type="button"
                        onClick={() =>
                          removeOption(questionIndex, optionIndex)
                        }
                        disabled={question.options.length <= 2}
                        className="text-sm text-red-600 hover:underline disabled:opacity-30"
                        aria-label={`Remove option ${optionIndex + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {question.type === "MCQ" && (
                <button
                  type="button"
                  onClick={() => addOption(questionIndex)}
                  disabled={question.options.length >= 6}
                  className="mt-3 text-sm font-medium text-blue-600 hover:underline disabled:opacity-40"
                >
                  + Add Option
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving Quiz..." : "Save Quiz"}
        </button>
      </form>
    </div>
  );
}

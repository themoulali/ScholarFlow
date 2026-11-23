
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { QuizQuestionType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    lessonId: string;
  };
};

type QuizOptionInput = {
  text: string;
  isCorrect: boolean;
};

type QuizQuestionInput = {
  question: string;
  type: "MCQ" | "TRUE_FALSE";
  options: QuizOptionInput[];
};

async function verifyLessonOwnership(
  lessonId: string,
  instructorId: string
) {
  return prisma.lesson.findFirst({
    where: {
      id: lessonId,
      section: {
        course: {
          instructorId,
        },
      },
    },
    select: {
      id: true,
    },
  });
}

// GET: Retrieve a lesson quiz for its instructor.
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can access quizzes." },
        { status: 403 }
      );
    }

    const lesson = await verifyLessonOwnership(
      params.lessonId,
      session.user.id
    );

    if (!lesson) {
      return NextResponse.json(
        { message: "Lesson not found." },
        { status: 404 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        lessonId: lesson.id,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Quiz retrieved successfully.",
        quiz,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quiz retrieval error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve quiz." },
      { status: 500 }
    );
  }
}

// PUT: Create or replace a lesson quiz.
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can update quizzes." },
        { status: 403 }
      );
    }

    const lesson = await verifyLessonOwnership(
      params.lessonId,
      session.user.id
    );

    if (!lesson) {
      return NextResponse.json(
        { message: "Lesson not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { title, description, questions } = body;

    if (
      typeof title !== "string" ||
      title.trim().length < 2 ||
      title.trim().length > 150
    ) {
      return NextResponse.json(
        { message: "Quiz title must be between 2 and 150 characters." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 2000)
    ) {
      return NextResponse.json(
        { message: "Description cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(questions) ||
      questions.length < 1 ||
      questions.length > 50
    ) {
      return NextResponse.json(
        { message: "A quiz must contain between 1 and 50 questions." },
        { status: 400 }
      );
    }

    const normalizedQuestions = [];

    for (let index = 0; index < questions.length; index++) {
      const item = questions[index] as QuizQuestionInput;

      if (
        !item ||
        typeof item !== "object" ||
        typeof item.question !== "string" ||
        item.question.trim().length < 3 ||
        item.question.trim().length > 1000
      ) {
        return NextResponse.json(
          { message: `Question ${index + 1} must contain 3 to 1000 characters.` },
          { status: 400 }
        );
      }

      if (item.type !== "MCQ" && item.type !== "TRUE_FALSE") {
        return NextResponse.json(
          { message: `Question ${index + 1} has an invalid question type.` },
          { status: 400 }
        );
      }

      if (!Array.isArray(item.options)) {
        return NextResponse.json(
          { message: `Question ${index + 1} must contain options.` },
          { status: 400 }
        );
      }

      if (
        item.type === "MCQ" &&
        (item.options.length < 2 || item.options.length > 6)
      ) {
        return NextResponse.json(
          { message: `MCQ question ${index + 1} must have 2 to 6 options.` },
          { status: 400 }
        );
      }

      if (
        item.type === "TRUE_FALSE" &&
        item.options.length !== 2
      ) {
        return NextResponse.json(
          { message: `True/False question ${index + 1} must have exactly two options.` },
          { status: 400 }
        );
      }

      const options = [];

      for (let optionIndex = 0; optionIndex < item.options.length; optionIndex++) {
        const option = item.options[optionIndex];

        if (
          !option ||
          typeof option.text !== "string" ||
          option.text.trim().length < 1 ||
          option.text.trim().length > 500 ||
          typeof option.isCorrect !== "boolean"
        ) {
          return NextResponse.json(
            { message: `An option in question ${index + 1} is invalid.` },
            { status: 400 }
          );
        }

        options.push({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          order: optionIndex,
        });
      }

      if (options.filter((option) => option.isCorrect).length !== 1) {
        return NextResponse.json(
          { message: `Question ${index + 1} must have exactly one correct answer.` },
          { status: 400 }
        );
      }

      if (item.type === "TRUE_FALSE") {
        const labels = options.map((option) => option.text.toLowerCase());

        if (
          !labels.includes("true") ||
          !labels.includes("false")
        ) {
          return NextResponse.json(
            { message: `True/False question ${index + 1} must use True and False options.` },
            { status: 400 }
          );
        }
      }

      normalizedQuestions.push({
        question: item.question.trim(),
        type:
          item.type === "MCQ"
            ? QuizQuestionType.MCQ
            : QuizQuestionType.TRUE_FALSE,
        order: index,
        options: {
          create: options,
        },
      });
    }

    const quiz = await prisma.quiz.upsert({
      where: {
        lessonId: lesson.id,
      },
      create: {
        lessonId: lesson.id,
        title: title.trim(),
        description: description?.trim() || null,
        questions: {
          create: normalizedQuestions,
        },
      },
      update: {
        title: title.trim(),
        description: description?.trim() || null,
        questions: {
          deleteMany: {},
          create: normalizedQuestions,
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Quiz saved successfully.",
        quiz,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quiz saving error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to save quiz." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCourseAnswer } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 20000;

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication.
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Only students can use the learning assistant.
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can use the AI learning assistant." },
        { status: 403 }
      );
    }

    // 3. Validate request body.
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { courseId, question } = body;

    if (
      typeof courseId !== "string" ||
      !courseId.trim() ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        { error: "Course ID and question are required." },
        { status: 400 }
      );
    }

    if (question.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: "Question cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    // 4. Verify published course and student enrollment.
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        status: "PUBLISHED",
        enrollments: {
          some: {
            studentId: session.user.id,
            status: {
              in: ["ACTIVE", "COMPLETED"],
            },
          },
        },
      },
      select: {
        title: true,
        description: true,
        category: true,
        instructor: {
          select: {
            name: true,
          },
        },
        sections: {
          orderBy: {
            order: "asc",
          },
          select: {
            title: true,
            lessons: {
              orderBy: {
                order: "asc",
              },
              select: {
                title: true,
                description: true,
                content: {
                  select: {
                    markdown: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          error: "Course not found or you are not enrolled in this course.",
        },
        { status: 404 }
      );
    }

    // 5. Build course-specific learning context.
    const contextParts = [
      `Course: ${course.title}`,
      `Category: ${course.category}`,
      `Instructor: ${course.instructor.name}`,
      `Course Description: ${course.description}`,
    ];

    for (const section of course.sections) {
      contextParts.push(`Section: ${section.title}`);

      for (const lesson of section.lessons) {
        contextParts.push(`Lesson: ${lesson.title}`);

        if (lesson.description) {
          contextParts.push(
            `Lesson Description: ${lesson.description}`
          );
        }

        if (lesson.content?.markdown) {
          contextParts.push(
            `Lesson Content:\n${lesson.content.markdown}`
          );
        }
      }
    }

    const courseContext = contextParts.join("\n\n").slice(
      0,
      MAX_CONTEXT_LENGTH
    );

    // 6. Generate the AI answer.
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 503 }
      );
    }

    const answer = await generateCourseAnswer({
      question: question.trim(),
      courseContext,
    });

    // 7. Return the generated answer.
    return NextResponse.json(
      {
        message: "AI answer generated successfully.",
        answer,
        course: {
          title: course.title,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI assistant API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format." },
        { status: 400 }
      );
    }

    const status =
      typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
        ? error.status
        : undefined;

    if (status === 503 || status === 429) {
      return NextResponse.json(
        {
          error:
            "The AI service is temporarily busy. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Unable to generate an AI answer. Please try again later." },
      { status: 502 }
    );
  }
}

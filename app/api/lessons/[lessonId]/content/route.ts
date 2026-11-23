
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    lessonId: string;
  };
};

// Verify instructor authentication and lesson ownership.
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

// GET: Retrieve lesson content.
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
        { message: "Only instructors can access lesson content." },
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

    const content = await prisma.lessonContent.findUnique({
      where: {
        lessonId: lesson.id,
      },
    });

    return NextResponse.json(
      {
        message: "Lesson content retrieved successfully.",
        content,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lesson content retrieval error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve lesson content." },
      { status: 500 }
    );
  }
}

// PUT: Create or update lesson content.
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
        { message: "Only instructors can update lesson content." },
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

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const contentJson = body.contentJson;
    const markdown = body.markdown;

    if (
      !contentJson ||
      typeof contentJson !== "object" ||
      Array.isArray(contentJson) ||
      contentJson.type !== "doc" ||
      !Array.isArray(contentJson.content)
    ) {
      return NextResponse.json(
        { message: "A valid TipTap document is required." },
        { status: 400 }
      );
    }

    if (
      typeof markdown !== "string" ||
      markdown.trim().length === 0 ||
      markdown.length > 1000000
    ) {
      return NextResponse.json(
        { message: "Markdown content is required and cannot exceed 1 MB." },
        { status: 400 }
      );
    }

    const content = await prisma.lessonContent.upsert({
      where: {
        lessonId: lesson.id,
      },
      create: {
        lessonId: lesson.id,
        contentJson,
        markdown,
      },
      update: {
        contentJson,
        markdown,
      },
    });

    return NextResponse.json(
      {
        message: "Lesson content saved successfully.",
        content,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lesson content saving error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to save lesson content." },
      { status: 500 }
    );
  }
}

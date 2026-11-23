
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    sectionId: string;
  };
};

// GET: Retrieve lessons belonging to a section.
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
        { message: "Only instructors can view section lessons." },
        { status: 403 }
      );
    }

    const section = await prisma.courseSection.findFirst({
      where: {
        id: params.sectionId,
        course: {
          instructorId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found." },
        { status: 404 }
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        sectionId: section.id,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        content: true,
        videos: true,
      },
    });

    return NextResponse.json(
      {
        message: "Lessons retrieved successfully.",
        count: lessons.length,
        lessons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lesson listing error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve lessons." },
      { status: 500 }
    );
  }
}

// POST: Create a lesson inside a section.
export async function POST(
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
        { message: "Only instructors can create lessons." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    if (title.length < 2 || title.length > 150) {
      return NextResponse.json(
        { message: "Lesson title must contain 2–150 characters." },
        { status: 400 }
      );
    }

    if (
      description !== null &&
      description.length > 2000
    ) {
      return NextResponse.json(
        { message: "Lesson description cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    if (
      body.order !== undefined &&
      (!Number.isInteger(body.order) || body.order < 0)
    ) {
      return NextResponse.json(
        { message: "Lesson order must be a non-negative integer." },
        { status: 400 }
      );
    }

    const section = await prisma.courseSection.findFirst({
      where: {
        id: params.sectionId,
        course: {
          instructorId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found." },
        { status: 404 }
      );
    }

    const lesson = await prisma.$transaction(async (transaction) => {
      const highestOrder = await transaction.lesson.aggregate({
        where: {
          sectionId: section.id,
        },
        _max: {
          order: true,
        },
      });

      const lessonOrder =
        body.order !== undefined
          ? body.order
          : (highestOrder._max.order ?? -1) + 1;

      return transaction.lesson.create({
        data: {
          title,
          description,
          order: lessonOrder,
          sectionId: section.id,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Lesson created successfully.",
        lesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lesson creation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create lesson." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AssignmentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a new assignment
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate instructor
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify role
    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can create assignments." },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const courseId =
      typeof body.courseId === "string" ? body.courseId.trim() : "";

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const instructions =
      typeof body.instructions === "string"
        ? body.instructions.trim()
        : "";

    const dueDate =
      typeof body.dueDate === "string" ? body.dueDate.trim() : "";

    const maxMarks =
      body.maxMarks === undefined ? 100 : body.maxMarks;

    const allowLateSubmissions =
      body.allowLateSubmissions === undefined
        ? false
        : body.allowLateSubmissions;

    // 4. Validate input
    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required." },
        { status: 400 }
      );
    }

    if (title.length < 3 || title.length > 150) {
      return NextResponse.json(
        { message: "Title must contain 3-150 characters." },
        { status: 400 }
      );
    }

    if (!instructions || instructions.length > 10000) {
      return NextResponse.json(
        { message: "Instructions are required and must not exceed 10000 characters." },
        { status: 400 }
      );
    }

    const parsedDueDate = new Date(dueDate);

    if (
      !dueDate ||
      Number.isNaN(parsedDueDate.getTime()) ||
      !/^\d{4}-\d{2}-\d{2}T/.test(dueDate)
    ) {
      return NextResponse.json(
        { message: "Please provide a valid ISO date and time for the deadline." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(maxMarks) ||
      maxMarks < 1 ||
      maxMarks > 10000
    ) {
      return NextResponse.json(
        { message: "Maximum marks must be an integer between 1 and 10000." },
        { status: 400 }
      );
    }

    if (typeof allowLateSubmissions !== "boolean") {
      return NextResponse.json(
        { message: "allowLateSubmissions must be true or false." },
        { status: 400 }
      );
    }

    // 5. Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found or you do not own this course." },
        { status: 404 }
      );
    }

    // 6. Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        instructions,
        dueDate: parsedDueDate,
        maxMarks,
        allowLateSubmissions,
        status: AssignmentStatus.DRAFT,
        courseId: course.id,
      },
      select: {
        id: true,
        title: true,
        instructions: true,
        dueDate: true,
        maxMarks: true,
        allowLateSubmissions: true,
        status: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Assignment created successfully.",
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assignment creation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create assignment." },
      { status: 500 }
    );
  }
}

// GET: Retrieve instructor assignments
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate instructor
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify role
    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can view their assignments." },
        { status: 403 }
      );
    }

    // 3. Read optional course filter
    const courseId = request.nextUrl.searchParams.get("courseId");

    // 4. Retrieve assignments belonging to instructor
    const assignments = await prisma.assignment.findMany({
      where: {
        course: {
          instructorId: session.user.id,
        },
        ...(courseId ? { courseId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        instructions: true,
        dueDate: true,
        maxMarks: true,
        allowLateSubmissions: true,
        status: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Assignments retrieved successfully.",
        count: assignments.length,
        assignments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assignment listing error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve assignments." },
      { status: 500 }
    );
  }
}

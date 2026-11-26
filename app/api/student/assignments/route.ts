import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AssignmentStatus, EnrollmentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET: Retrieve published assignments for the logged-in student
export async function GET() {
  try {
    // 1. Authenticate student
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify student role
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can view student assignments." },
        { status: 403 }
      );
    }

    // 3. Find published assignments in actively enrolled courses
    const assignments = await prisma.assignment.findMany({
      where: {
        status: AssignmentStatus.PUBLISHED,
        course: {
          enrollments: {
            some: {
              studentId: session.user.id,
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      select: {
        id: true,
        title: true,
        instructions: true,
        dueDate: true,
        maxMarks: true,
        allowLateSubmissions: true,
        status: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        submissions: {
          where: {
            studentId: session.user.id,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            isLate: true,
            marks: true,
            feedback: true,
            gradedAt: true,
            answerText: true,
            fileName: true,
          },
        },
      },
    });

    // 4. Add a convenient deadline status for the student
    const now = new Date();

    const result = assignments.map((assignment) => ({
      ...assignment,
      isPastDue: assignment.dueDate < now,
      submission: assignment.submissions[0] ?? null,
      submissions: undefined,
    }));

    return NextResponse.json(
      {
        message: "Student assignments retrieved successfully.",
        count: result.length,
        assignments: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student assignment listing error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve student assignments." },
      { status: 500 }
    );
  }
}

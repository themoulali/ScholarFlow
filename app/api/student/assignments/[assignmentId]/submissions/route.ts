
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  AssignmentStatus,
  EnrollmentStatus,
  SubmissionStatus,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    assignmentId: string;
  };
};

// POST: Submit or resubmit a text answer
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
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
        { message: "Only students can submit assignments." },
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

    const answerText =
      typeof body.answerText === "string"
        ? body.answerText.trim()
        : "";

    if (!answerText || answerText.length > 10000) {
      return NextResponse.json(
        {
          message:
            "Your answer is required and must not exceed 10000 characters.",
        },
        { status: 400 }
      );
    }

    // 4. Verify assignment and active enrollment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
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
      select: {
        id: true,
        title: true,
        dueDate: true,
        allowLateSubmissions: true,
        maxMarks: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          message:
            "Assignment not found, not published, or you are not actively enrolled in its course.",
        },
        { status: 404 }
      );
    }

    // 5. Check submission deadline
    const submittedAt = new Date();
    const isLate = submittedAt > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmissions) {
      return NextResponse.json(
        {
          message: "The submission deadline has passed.",
          dueDate: assignment.dueDate,
        },
        { status: 409 }
      );
    }

    // 6. Create submission or update an existing submission
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: session.user.id,
        },
      },
      create: {
        assignmentId: assignment.id,
        studentId: session.user.id,
        answerText,
        submittedAt,
        isLate,
        status: SubmissionStatus.SUBMITTED,
      },
      update: {
        answerText,
        submittedAt,
        isLate,
        status: SubmissionStatus.SUBMITTED,
        marks: null,
        feedback: null,
        gradedAt: null,
        fileUrl: null,
        fileName: null,
        fileSize: null,
      },
      select: {
        id: true,
        answerText: true,
        submittedAt: true,
        isLate: true,
        status: true,
        marks: true,
        feedback: true,
        gradedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Assignment submitted successfully.",
        assignment: {
          id: assignment.id,
          title: assignment.title,
          maxMarks: assignment.maxMarks,
        },
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assignment submission error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to submit assignment." },
      { status: 500 }
    );
  }
}

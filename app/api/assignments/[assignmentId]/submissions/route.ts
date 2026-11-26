
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SubmissionStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    assignmentId: string;
  };
};

// GET: View submissions for an instructor's assignment
export async function GET(
  _request: NextRequest,
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
        { message: "Only instructors can view submissions." },
        { status: 403 }
      );
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
        course: {
          instructorId: session.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        maxMarks: true,
        dueDate: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found or access denied." },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: assignment.id,
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        answerText: true,
        fileName: true,
        fileSize: true,
        submittedAt: true,
        isLate: true,
        status: true,
        marks: true,
        feedback: true,
        gradedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        assignment,
        totalSubmissions: submissions.length,
        submissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch submissions error:", error);

    return NextResponse.json(
      { message: "Unable to fetch submissions." },
      { status: 500 }
    );
  }
}

// PATCH: Grade a student's submission
export async function PATCH(
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
        { message: "Only instructors can grade submissions." },
        { status: 403 }
      );
    }

    // Verify assignment ownership
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
        course: {
          instructorId: session.user.id,
        },
      },
      select: {
        id: true,
        maxMarks: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found or access denied." },
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

    const { submissionId, marks, feedback } = body;

    if (
      typeof submissionId !== "string" ||
      !submissionId.trim()
    ) {
      return NextResponse.json(
        { message: "A valid submissionId is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(marks) ||
      marks < 0 ||
      marks > assignment.maxMarks
    ) {
      return NextResponse.json(
        {
          message: `Marks must be an integer between 0 and ${assignment.maxMarks}.`,
        },
        { status: 400 }
      );
    }

    if (
      feedback !== undefined &&
      feedback !== null &&
      (typeof feedback !== "string" || feedback.length > 5000)
    ) {
      return NextResponse.json(
        { message: "Feedback must not exceed 5000 characters." },
        { status: 400 }
      );
    }

    // Ensure the submission belongs to this assignment
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        assignmentId: assignment.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { message: "Submission not found for this assignment." },
        { status: 404 }
      );
    }

    const gradedSubmission = await prisma.submission.update({
      where: {
        id: existingSubmission.id,
      },
      data: {
        marks,
        feedback: feedback?.trim() || null,
        status: SubmissionStatus.GRADED,
        gradedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        marks: true,
        feedback: true,
        gradedAt: true,
        submittedAt: true,
        isLate: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Submission graded successfully.",
        submission: gradedSubmission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Grade submission error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to grade submission." },
      { status: 500 }
    );
  }
}

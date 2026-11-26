
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AssignmentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    assignmentId: string;
  };
};

// Helper: verify that the assignment belongs to the logged-in instructor
async function getInstructorAssignment(
  assignmentId: string,
  instructorId: string
) {
  return prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        instructorId,
      },
    },
  });
}

// PATCH: Update assignment details or status
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
        { message: "Only instructors can update assignments." },
        { status: 403 }
      );
    }

    const assignment = await getInstructorAssignment(
      params.assignmentId,
      session.user.id
    );

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

    const updateData: {
      title?: string;
      instructions?: string;
      dueDate?: Date;
      maxMarks?: number;
      allowLateSubmissions?: boolean;
      status?: AssignmentStatus;
    } = {};

    // Validate and update title
    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        body.title.trim().length < 3 ||
        body.title.trim().length > 150
      ) {
        return NextResponse.json(
          { message: "Title must contain 3-150 characters." },
          { status: 400 }
        );
      }

      updateData.title = body.title.trim();
    }

    // Validate and update instructions
    if (body.instructions !== undefined) {
      if (
        typeof body.instructions !== "string" ||
        !body.instructions.trim() ||
        body.instructions.trim().length > 10000
      ) {
        return NextResponse.json(
          { message: "Instructions are required and must not exceed 10000 characters." },
          { status: 400 }
        );
      }

      updateData.instructions = body.instructions.trim();
    }

    // Validate and update deadline
    if (body.dueDate !== undefined) {
      if (
        typeof body.dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T/.test(body.dueDate)
      ) {
        return NextResponse.json(
          { message: "Provide a valid ISO date and time." },
          { status: 400 }
        );
      }

      const parsedDate = new Date(body.dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { message: "Invalid assignment deadline." },
          { status: 400 }
        );
      }

      updateData.dueDate = parsedDate;
    }

    // Validate and update maximum marks
    if (body.maxMarks !== undefined) {
      if (
        !Number.isInteger(body.maxMarks) ||
        body.maxMarks < 1 ||
        body.maxMarks > 10000
      ) {
        return NextResponse.json(
          { message: "Maximum marks must be between 1 and 10000." },
          { status: 400 }
        );
      }

      updateData.maxMarks = body.maxMarks;
    }

    // Validate late submission setting
    if (body.allowLateSubmissions !== undefined) {
      if (typeof body.allowLateSubmissions !== "boolean") {
        return NextResponse.json(
          { message: "allowLateSubmissions must be true or false." },
          { status: 400 }
        );
      }

      updateData.allowLateSubmissions = body.allowLateSubmissions;
    }

    // Validate assignment status
    if (body.status !== undefined) {
      const validStatuses = Object.values(AssignmentStatus);

      if (
        typeof body.status !== "string" ||
        !validStatuses.includes(body.status as AssignmentStatus)
      ) {
        return NextResponse.json(
          { message: "Invalid assignment status." },
          { status: 400 }
        );
      }

      updateData.status = body.status as AssignmentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for updating." },
        { status: 400 }
      );
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: assignment.id,
      },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "Assignment updated successfully.",
        assignment: updatedAssignment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assignment update error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to update assignment." },
      { status: 500 }
    );
  }
}

// DELETE: Delete an assignment only when it has no submissions
export async function DELETE(
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
        { message: "Only instructors can delete assignments." },
        { status: 403 }
      );
    }

    const assignment = await getInstructorAssignment(
      params.assignmentId,
      session.user.id
    );

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found or access denied." },
        { status: 404 }
      );
    }

    const submissionCount = await prisma.submission.count({
      where: {
        assignmentId: assignment.id,
      },
    });

    if (submissionCount > 0) {
      return NextResponse.json(
        {
          message:
            "This assignment has submissions and cannot be deleted. Archive it instead.",
          submissionCount,
        },
        { status: 409 }
      );
    }

    await prisma.assignment.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json(
      { message: "Assignment deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assignment deletion error:", error);

    return NextResponse.json(
      { message: "Unable to delete assignment." },
      { status: 500 }
    );
  }
}

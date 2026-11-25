
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    courseId: string;
  };
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can enroll in courses" },
        { status: 403 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Course not found or not available for enrollment" },
        { status: 404 }
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 }
      );
    }

    if (existingEnrollment?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "You have already completed this course" },
        { status: 409 }
      );
    }

    const enrollment = existingEnrollment
      ? await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ACTIVE" },
        })
      : await prisma.enrollment.create({
          data: {
            studentId: session.user.id,
            courseId: course.id,
          },
        });

    return NextResponse.json(
      {
        message: "Successfully enrolled in course",
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Course enrollment error:", error);

    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can unenroll from courses" },
        { status: 403 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: params.courseId,
        },
      },
    });

    if (!enrollment || enrollment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 404 }
      );
    }

    if (enrollment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed courses cannot be cancelled" },
        { status: 409 }
      );
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Successfully unenrolled from course",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Course unenrollment error:", error);

    return NextResponse.json(
      { error: "Failed to unenroll from course" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    enrollmentId: string;
  };
};

async function updateSectionProgress(
  request: Request,
  context: RouteContext,
  markCompleted: boolean
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can update learning progress." },
        { status: 403 }
      );
    }

    let body: { sectionId?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const sectionId = body.sectionId;

    if (typeof sectionId !== "string" || !sectionId.trim()) {
      return NextResponse.json(
        { error: "A valid sectionId is required." },
        { status: 400 }
      );
    }

    // Verify that this enrollment belongs to the logged-in student.
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: context.params.enrollmentId,
        studentId: session.user.id,
      },
      select: {
        id: true,
        courseId: true,
        status: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found." },
        { status: 404 }
      );
    }

    if (enrollment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "You are not actively enrolled in this course." },
        { status: 409 }
      );
    }

    // Ensure the requested section belongs to this enrollment's course.
    const section = await prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        courseId: enrollment.courseId,
      },
      select: {
        id: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found in this course." },
        { status: 404 }
      );
    }

    // Update progress and enrollment status together.
    const result = await prisma.$transaction(async (tx) => {
      if (markCompleted) {
        await tx.sectionProgress.upsert({
          where: {
            enrollmentId_sectionId: {
              enrollmentId: enrollment.id,
              sectionId,
            },
          },
          create: {
            enrollmentId: enrollment.id,
            sectionId,
          },
          update: {},
        });
      } else {
        await tx.sectionProgress.deleteMany({
          where: {
            enrollmentId: enrollment.id,
            sectionId,
          },
        });
      }

      const sections = await tx.courseSection.findMany({
        where: {
          courseId: enrollment.courseId,
        },
        select: {
          id: true,
        },
      });

      const progressRecords = await tx.sectionProgress.findMany({
        where: {
          enrollmentId: enrollment.id,
        },
        select: {
          sectionId: true,
        },
      });

      const validSectionIds = new Set(
        sections.map((item) => item.id)
      );

      const completedSectionIds = Array.from(
        new Set(
          progressRecords
            .map((item) => item.sectionId)
            .filter((id) => validSectionIds.has(id))
        )
      );

      const totalSections = sections.length;
      const completedSections = completedSectionIds.length;

      const progressPercentage =
        totalSections === 0
          ? 0
          : Math.round(
              (completedSections / totalSections) * 100
            );

      const status =
        totalSections > 0 && completedSections === totalSections
          ? "COMPLETED"
          : "ACTIVE";

      await tx.enrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          status,
        },
      });

      return {
        status,
        totalSections,
        completedSections,
        progressPercentage,
        completedSectionIds,
      };
    });

    return NextResponse.json({
      message: markCompleted
        ? "Section marked as completed."
        : "Section marked as incomplete.",
      ...result,
    });
  } catch (error) {
    console.error("Section progress update error:", error);

    return NextResponse.json(
      { error: "Failed to update section progress." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  return updateSectionProgress(request, context, true);
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  return updateSectionProgress(request, context, false);
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
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
        { error: "Only students can access enrolled courses." },
        { status: 403 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: session.user.id,
        status: {
          in: ["ACTIVE", "COMPLETED"],
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            category: true,
            thumbnailUrl: true,
            instructor: {
              select: {
                name: true,
              },
            },
            sections: {
              select: {
                id: true,
                title: true,
                order: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        sectionProgress: {
          select: {
            sectionId: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    const courses = enrollments.map((enrollment) => {
      const sectionIds = new Set(
        enrollment.course.sections.map((section) => section.id)
      );

      const completedSectionIds = new Set(
        enrollment.sectionProgress
          .map((progress) => progress.sectionId)
          .filter((sectionId) => sectionIds.has(sectionId))
      );

      const totalSections = enrollment.course.sections.length;
      const completedSections = completedSectionIds.size;

      const progressPercentage =
        totalSections === 0
          ? 0
          : Math.round((completedSections / totalSections) * 100);

      return {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        course: enrollment.course,
        totalSections,
        completedSections,
        progressPercentage,
        completedSectionIds: Array.from(completedSectionIds),
      };
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Student enrollments error:", error);

    return NextResponse.json(
      { error: "Failed to fetch enrolled courses." },
      { status: 500 }
    );
  }
}

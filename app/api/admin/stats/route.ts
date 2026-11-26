
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify authentication.
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Only administrators can access platform statistics.
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Administrator access required." },
        { status: 403 }
      );
    }

    // Fetch all platform statistics concurrently.
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      cancelledEnrollments,
      totalAssignments,
      publishedAssignments,
      totalSubmissions,
      submittedSubmissions,
      gradedSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),

      prisma.course.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.course.count({ where: { status: "DRAFT" } }),
      prisma.course.count({ where: { status: "ARCHIVED" } }),

      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.enrollment.count({ where: { status: "COMPLETED" } }),
      prisma.enrollment.count({ where: { status: "CANCELLED" } }),

      prisma.assignment.count(),
      prisma.assignment.count({ where: { status: "PUBLISHED" } }),

      prisma.submission.count(),
      prisma.submission.count({ where: { status: "SUBMITTED" } }),
      prisma.submission.count({ where: { status: "GRADED" } }),
    ]);

    return NextResponse.json(
      {
        message: "Admin statistics retrieved successfully.",
        stats: {
          users: {
            total: totalUsers,
            students: totalStudents,
            instructors: totalInstructors,
            admins: totalAdmins,
          },
          courses: {
            total: totalCourses,
            published: publishedCourses,
            draft: draftCourses,
            archived: archivedCourses,
          },
          enrollments: {
            total: totalEnrollments,
            active: activeEnrollments,
            completed: completedEnrollments,
            cancelled: cancelledEnrollments,
          },
          assignments: {
            total: totalAssignments,
            published: publishedAssignments,
          },
          submissions: {
            total: totalSubmissions,
            submitted: submittedSubmissions,
            graded: gradedSubmissions,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin statistics API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve admin statistics." },
      { status: 500 }
    );
  }
}

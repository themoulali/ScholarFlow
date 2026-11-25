
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    courseId: string;
  };
};

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
        { message: "Only instructors can publish or archive courses." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !["PUBLISHED", "ARCHIVED"].includes(body.status)
    ) {
      return NextResponse.json(
        { message: "Status must be PUBLISHED or ARCHIVED." },
        { status: 400 }
      );
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    if (body.status === "PUBLISHED") {
      const sections = await prisma.courseSection.findMany({
        where: {
          courseId: existingCourse.id,
        },
        select: {
          lessons: {
            select: {
              id: true,
            },
          },
        },
      });

      if (
        sections.length === 0 ||
        sections.some((section) => section.lessons.length === 0)
      ) {
        return NextResponse.json(
          {
            message:
              "Add at least one section and one lesson to every section before publishing.",
          },
          { status: 400 }
        );
      }
    }

    const course = await prisma.course.update({
      where: {
        id: existingCourse.id,
      },
      data: {
        status: body.status,
        publishedAt:
          body.status === "PUBLISHED"
            ? existingCourse.publishedAt || new Date()
            : existingCourse.publishedAt,
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message:
          body.status === "PUBLISHED"
            ? "Course published successfully."
            : "Course archived successfully.",
        course,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course publishing error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to update course status." },
      { status: 500 }
    );
  }
}

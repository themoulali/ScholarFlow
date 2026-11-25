import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    courseId: string;
  };
};
const allowedCategories = [
  "Programming",
  "Web Development",
  "Data Science",
  "Artificial Intelligence",
  "Database",
  "Other",
  "General",
];

export async function GET(
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
        { message: "Only instructors can view courses." },
        { status: 403 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Course retrieved successfully.", course },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course retrieval error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve course." },
      { status: 500 }
    );
  }
}


export async function PUT(
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
        { message: "Only instructors can update courses." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : existingCourse.title;

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : existingCourse.description;

    const thumbnailUrl =
      typeof body.thumbnailUrl === "string"
        ? body.thumbnailUrl.trim()
        : body.thumbnailUrl === null
          ? null
          : existingCourse.thumbnailUrl;

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : existingCourse.category;

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { message: "Please select a valid course category." },
        { status: 400 }
      );
    }

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json(
        { message: "Title must contain 3–120 characters." },
        { status: 400 }
      );
    }

    if (!description || description.length > 5000) {
      return NextResponse.json(
        { message: "Description is required and must not exceed 5000 characters." },
        { status: 400 }
      );
    }

    if (
      thumbnailUrl &&
      (
        thumbnailUrl.length > 2048 ||
        !/^https?:\/\/\S+$/i.test(thumbnailUrl)
      )
    ) {
      return NextResponse.json(
        { message: "Please provide a valid thumbnail URL." },
        { status: 400 }
      );
    }

    const course = await prisma.course.update({
      where: {
        id: existingCourse.id,
      },
      data: {
        title,
        description,
        thumbnailUrl,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        category : true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Course updated successfully.",
        course,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course update error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to update course." },
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can delete courses." },
        { status: 403 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    if (course._count.enrollments > 0) {
      return NextResponse.json(
        {
          message:
            "This course cannot be deleted because students are enrolled. Archive it instead.",
        },
        { status: 409 }
      );
    }

    if (course.status === "PUBLISHED") {
      return NextResponse.json(
        {
          message:
            "Published courses cannot be deleted. Archive the course instead.",
        },
        { status: 409 }
      );
    }

    await prisma.course.delete({
      where: {
        id: course.id,
      },
    });

    return NextResponse.json(
      { message: "Course deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course deletion error:", error);

    return NextResponse.json(
      { message: "Unable to delete course." },
      { status: 500 }
    );
  }
}


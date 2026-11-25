
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function createSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return baseSlug;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify instructor role
    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can create courses." },
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

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const thumbnailUrl =
      typeof body.thumbnailUrl === "string"
        ? body.thumbnailUrl.trim()
        : null;

    const allowedCategories = [
      "Programming",
      "Web Development",
      "Data Science",
      "Artificial Intelligence",
      "Database",
      "Other",
      "General",
    ];

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "Programming";

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { message: "Please select a valid course category." },
        { status: 400 }
      );
    }
    // 4. Validate input
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

    // 5. Generate a unique slug
    const baseSlug = createSlug(title);

    if (!baseSlug) {
      return NextResponse.json(
        { message: "Please provide a title containing valid characters." },
        { status: 400 }
      );
    }

    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    // 6. Create course using Prisma
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        thumbnailUrl: thumbnailUrl || null,
        category,
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
      },
    });

    return NextResponse.json(
      {
        message: "Course created successfully.",
        course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Course creation error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "A course with this slug already exists." },
        { status: 409 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create course." },
      { status: 500 }
    );
  }
}

export async function GET() {
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
        { message: "Only instructors can view their courses." },
        { status: 403 }
      );
    }

    const courses = await prisma.course.findMany({
      where: {
        instructorId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
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

    return NextResponse.json(
      {
        message: "Courses retrieved successfully.",
        count: courses.length,
        courses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course listing error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve courses." },
      { status: 500 }
    );
  }
}

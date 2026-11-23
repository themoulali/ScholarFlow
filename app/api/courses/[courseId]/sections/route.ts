
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    courseId: string;
  };
};

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
        { message: "Only instructors can view course sections." },
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
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    const sections = await prisma.courseSection.findMany({
      where: {
        courseId: course.id,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(
      {
        message: "Course sections retrieved successfully.",
        count: sections.length,
        sections,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Section listing error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve course sections." },
      { status: 500 }
    );
  }
}

export async function POST(
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
        { message: "Only instructors can create course sections." },
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

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    if (title.length < 2 || title.length > 150) {
      return NextResponse.json(
        { message: "Section title must contain 2–150 characters." },
        { status: 400 }
      );
    }

    if (
      description !== null &&
      description.length > 2000
    ) {
      return NextResponse.json(
        { message: "Section description cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    if (
      body.order !== undefined &&
      (!Number.isInteger(body.order) || body.order < 0)
    ) {
      return NextResponse.json(
        { message: "Section order must be a non-negative integer." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    const section = await prisma.$transaction(async (transaction) => {
      const highestOrder = await transaction.courseSection.aggregate({
        where: {
          courseId: course.id,
        },
        _max: {
          order: true,
        },
      });

      const sectionOrder =
        body.order !== undefined
          ? body.order
          : (highestOrder._max.order ?? -1) + 1;

      return transaction.courseSection.create({
        data: {
          title,
          description,
          order: sectionOrder,
          courseId: course.id,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Course section created successfully.",
        section,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Section creation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create course section." },
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
        { message: "Only instructors can reorder course sections." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !Array.isArray(body.sectionIds) ||
      !body.sectionIds.every(
        (id: unknown) => typeof id === "string" && id.trim().length > 0
      )
    ) {
      return NextResponse.json(
        { message: "Please provide a valid sectionIds array." },
        { status: 400 }
      );
    }

    const sectionIds: string[] = body.sectionIds;

    if (new Set(sectionIds).size !== sectionIds.length) {
      return NextResponse.json(
        { message: "Duplicate section IDs are not allowed." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        instructorId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 }
      );
    }

    const existingSections = await prisma.courseSection.findMany({
      where: {
        courseId: course.id,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(
      existingSections.map((section) => section.id)
    );

    if (
      sectionIds.length !== existingIds.size ||
      sectionIds.some((id) => !existingIds.has(id))
    ) {
      return NextResponse.json(
        {
          message:
            "Please provide every section ID belonging to this course exactly once.",
        },
        { status: 400 }
      );
    }

    const updatedSections = await prisma.$transaction(async (transaction) => {
      for (let index = 0; index < sectionIds.length; index++) {
        const sectionId = sectionIds[index];

        await transaction.courseSection.update({
          where: {
            id: sectionId,
          },
          data: {
            order: index,
          },
        });
      }

      return transaction.courseSection.findMany({
        where: {
          courseId: course.id,
        },
        orderBy: {
          order: "asc",
        },
      });
    });

    return NextResponse.json(
      {
        message: "Course sections reordered successfully.",
        sections: updatedSections,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Section reordering error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to reorder course sections." },
      { status: 500 }
    );
  }
}

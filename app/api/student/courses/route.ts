
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
        { error: "Only students can browse the course catalog" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        ...(search
          ? {
              title: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(category && category !== "ALL"
          ? { category }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        thumbnailUrl: true,
        publishedAt: true,
        instructor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Student course catalog error:", error);

    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 }
    );
  }
}

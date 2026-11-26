
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validRoles = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;

type UserRole = (typeof validRoles)[number];

async function authorizeAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Forbidden. Administrator access required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    userId: session.user.id,
  };
}

// GET: Retrieve registered users.
export async function GET() {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

      return NextResponse.json({
          message: "Users retrieved successfully.",
          currentUserId: auth.userId,
          users,
      });
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve users." },
      { status: 500 }
    );
  }
}

// PATCH: Update a user's role.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    const { userId, role } = body;

    if (
      typeof userId !== "string" ||
      !userId.trim() ||
      typeof role !== "string" ||
      !validRoles.includes(role as UserRole)
    ) {
      return NextResponse.json(
        { error: "A valid user ID and role are required." },
        { status: 400 }
      );
    }

    if (userId === auth.userId) {
      return NextResponse.json(
        { error: "You cannot change your own administrator role." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        return { status: "NOT_FOUND" as const };
      }

      if (targetUser.role === "ADMIN" && role !== "ADMIN") {
        const adminCount = await tx.user.count({
          where: { role: "ADMIN" },
        });

        if (adminCount <= 1) {
          return { status: "LAST_ADMIN" as const };
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: role as UserRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        status: "UPDATED" as const,
        user: updatedUser,
      };
    });

    if (result.status === "NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (result.status === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "The last administrator cannot be demoted." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "User role updated successfully.",
      user: result.user,
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update user role." },
      { status: 500 }
    );
  }
}

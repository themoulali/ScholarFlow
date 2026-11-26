
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  AssignmentStatus,
  EnrollmentStatus,
  SubmissionStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  supabaseAdmin,
  SUBMISSIONS_BUCKET,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    assignmentId: string;
  };
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function safeFileName(name: string) {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(-150);

  return cleaned || "submission-file";
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  let uploadedPath: string | null = null;

  try {
    // 1. Authenticate student
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify student role
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can upload assignment files." },
        { status: 403 }
      );
    }

    // 3. Read multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: "Please select a file to upload." },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size must not exceed 10 MB." },
        { status: 413 }
      );
    }

    // 5. Validate file extension and MIME type
    const originalName = file.name;
    const extension =
      originalName.lastIndexOf(".") >= 0
        ? originalName.slice(originalName.lastIndexOf(".")).toLowerCase()
        : "";

    const expectedMimeType = allowedTypes[extension];

    if (!expectedMimeType || file.type !== expectedMimeType) {
      return NextResponse.json(
        {
          message:
            "Unsupported file type. Upload PDF, DOC, DOCX, TXT, PNG, or JPG files.",
        },
        { status: 415 }
      );
    }

    // 6. Verify assignment and active enrollment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
        status: AssignmentStatus.PUBLISHED,
        course: {
          enrollments: {
            some: {
              studentId: session.user.id,
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        allowLateSubmissions: true,
        maxMarks: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          message:
            "Assignment not found, not published, or you are not actively enrolled.",
        },
        { status: 404 }
      );
    }

    // 7. Check deadline
    const submittedAt = new Date();
    const isLate = submittedAt > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmissions) {
      return NextResponse.json(
        {
          message: "The submission deadline has passed.",
          dueDate: assignment.dueDate,
        },
        { status: 409 }
      );
    }

    // 8. Generate a private, unique storage path
    const storedFileName = safeFileName(originalName);

    const storagePath =
      `${assignment.id}/${session.user.id}/` +
      `${randomUUID()}-${storedFileName}`;

    // 9. Upload to private Supabase Storage
    const fileBuffer = new Uint8Array(
      await file.arrayBuffer()
    );

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUBMISSIONS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: expectedMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);

      return NextResponse.json(
        { message: "Unable to upload file to storage." },
        { status: 500 }
      );
    }

    uploadedPath = storagePath;

    // 10. Create or update the student's submission
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: session.user.id,
        },
      },
      create: {
        assignmentId: assignment.id,
        studentId: session.user.id,
        answerText: null,
        fileUrl: storagePath,
        fileName: storedFileName,
        fileSize: file.size,
        submittedAt,
        isLate,
        status: SubmissionStatus.SUBMITTED,
      },
      update: {
        fileUrl: storagePath,
        fileName: storedFileName,
        fileSize: file.size,
        submittedAt,
        isLate,
        status: SubmissionStatus.SUBMITTED,
        marks: null,
        feedback: null,
        gradedAt: null,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        submittedAt: true,
        isLate: true,
        status: true,
        marks: true,
        feedback: true,
      },
    });

    uploadedPath = null;

    return NextResponse.json(
      {
        message: "Assignment file uploaded successfully.",
        assignment: {
          id: assignment.id,
          title: assignment.title,
          maxMarks: assignment.maxMarks,
        },
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assignment file upload error:", error);

    // Remove uploaded file if database operation failed
    if (uploadedPath) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(SUBMISSIONS_BUCKET)
        .remove([uploadedPath]);

      if (cleanupError) {
        console.error("Storage cleanup error:", cleanupError);
      }
    }

    return NextResponse.json(
      { message: "Unable to process assignment file upload." },
      { status: 500 }
    );
  }
}


export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Allow only students and instructors
    if (
      session.user.role !== "STUDENT" &&
      session.user.role !== "INSTRUCTOR"
    ) {
      return NextResponse.json(
        { message: "You are not authorized to access files." },
        { status: 403 }
      );
    }

    // 3. Get submission ID
    const submissionId =
      request.nextUrl.searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { message: "Submission ID is required." },
        { status: 400 }
      );
    }

    // 4. Find submission and its assignment ownership
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        assignmentId: params.assignmentId,
      },
      select: {
        id: true,
        studentId: true,
        fileUrl: true,
        fileName: true,
        assignment: {
          select: {
            course: {
              select: {
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!submission || !submission.fileUrl) {
      return NextResponse.json(
        { message: "Submission file not found." },
        { status: 404 }
      );
    }

    // 5. Verify file ownership or instructor ownership
    const isStudentOwner =
      session.user.role === "STUDENT" &&
      submission.studentId === session.user.id;

    const isAssignmentInstructor =
      session.user.role === "INSTRUCTOR" &&
      submission.assignment.course.instructorId ===
        session.user.id;

    if (!isStudentOwner && !isAssignmentInstructor) {
      return NextResponse.json(
        { message: "You cannot access this submission file." },
        { status: 403 }
      );
    }

    // 6. Generate a temporary signed download URL
    const { data, error } = await supabaseAdmin.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUrl(submission.fileUrl, 60);

    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error);

      return NextResponse.json(
        { message: "Unable to generate download link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Temporary download link generated successfully.",
      fileName: submission.fileName,
      signedUrl: data.signedUrl,
      expiresInSeconds: 60,
    });
  } catch (error) {
    console.error("Submission download error:", error);

    return NextResponse.json(
      { message: "Unable to access submission file." },
      { status: 500 }
    );
  }
}


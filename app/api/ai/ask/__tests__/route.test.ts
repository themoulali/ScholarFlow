/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { generateCourseAnswer } from "@/lib/ai";
import { POST } from "../route";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/ai", () => ({
  generateCourseAnswer: jest.fn(),
}));

const sessionMock = getServerSession as jest.Mock;
const findFirstMock = prisma.course.findFirst as jest.Mock;
const generateAnswerMock = generateCourseAnswer as jest.Mock;

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  courseId: "course-123",
  question: "Explain Python decorators.",
};

const mockCourse = {
  title: "Python Full Stack",
  description: "Learn Python development.",
  category: "Programming",
  instructor: {
    name: "Test Instructor",
  },
  sections: [
    {
      title: "Advanced Python",
      lessons: [
        {
          title: "Python Decorators",
          description: "Introduction to decorators.",
          content: {
            markdown: "Decorators modify function behavior.",
          },
        },
      ],
    },
  ],
};

describe("POST /api/ai/ask", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key";

    sessionMock.mockResolvedValue({
      user: {
        id: "student-123",
        role: "STUDENT",
      },
    });

    findFirstMock.mockResolvedValue(mockCourse);
    generateAnswerMock.mockResolvedValue(
      "A Python decorator modifies a function's behavior."
    );
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  test("returns 401 when the user is not authenticated", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/unauthorized/i);
  });

  test("returns 403 when the user is not a student", async () => {
    sessionMock.mockResolvedValue({
      user: {
        id: "instructor-123",
        role: "INSTRUCTOR",
      },
    });

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/only students/i);
  });

  test("returns 400 when required fields are missing", async () => {
    const response = await POST(
      createRequest({ courseId: "course-123" })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  test("returns 400 when the question exceeds 1000 characters", async () => {
    const response = await POST(
      createRequest({
        courseId: "course-123",
        question: "A".repeat(1001),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/1000 characters/i);
  });

  test("returns 404 when the student is not enrolled in the course", async () => {
    findFirstMock.mockResolvedValue(null);

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found or you are not enrolled/i);
    expect(generateAnswerMock).not.toHaveBeenCalled();
  });

  test("returns 503 when the Gemini API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toMatch(/not configured/i);
    expect(generateAnswerMock).not.toHaveBeenCalled();
  });

  test("returns 200 with an AI answer for a valid request", async () => {
    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.answer).toContain("Python decorator");
    expect(data.course.title).toBe("Python Full Stack");

    expect(generateAnswerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "Explain Python decorators.",
        courseContext: expect.stringContaining("Python Decorators"),
      })
    );
  });

  test("returns 503 when Gemini is temporarily unavailable", async () => {
    generateAnswerMock.mockRejectedValue({
      status: 503,
      message: "Service unavailable",
    });

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toMatch(/temporarily busy/i);
  });
});
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

const findUniqueMock = prisma.user.findUnique as jest.Mock;
const compareMock = compare as jest.Mock;

const credentialsProvider = authOptions.providers[0] as CredentialsConfig;
const authorize = credentialsProvider.options!.authorize!;
const mockRequest = {} as Parameters<typeof authorize>[1];

describe("Authentication authorize function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects missing credentials", async () => {
    const result = await authorize(undefined, mockRequest);

    expect(result).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  test("normalizes email before database lookup", async () => {
    findUniqueMock.mockResolvedValue(null);

    await authorize(
      { email: "  STUDENT@EXAMPLE.COM  ", password: "password123" },
      mockRequest
    );

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "student@example.com" },
    });
  });

  test("rejects a user who does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await authorize(
      { email: "unknown@example.com", password: "password123" },
      mockRequest
    );

    expect(result).toBeNull();
    expect(compareMock).not.toHaveBeenCalled();
  });

  test("rejects a user without a password hash", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      name: "Test Student",
      email: "student@example.com",
      passwordHash: null,
      role: "STUDENT",
    });

    const result = await authorize(
      { email: "student@example.com", password: "password123" },
      mockRequest
    );

    expect(result).toBeNull();
    expect(compareMock).not.toHaveBeenCalled();
  });

  test("rejects an incorrect password", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      name: "Test Student",
      email: "student@example.com",
      passwordHash: "mock-hash",
      role: "STUDENT",
    });

    compareMock.mockResolvedValue(false);

    const result = await authorize(
      { email: "student@example.com", password: "wrong-password" },
      mockRequest
    );

    expect(result).toBeNull();
  });

  test("returns user details when credentials are valid", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      name: "Test Student",
      email: "student@example.com",
      passwordHash: "mock-hash",
      role: "STUDENT",
    });

    compareMock.mockResolvedValue(true);

    const result = await authorize(
      { email: "student@example.com", password: "correct-password" },
      mockRequest
    );

    expect(result).toEqual({
      id: "user-1",
      name: "Test Student",
      email: "student@example.com",
      role: "STUDENT",
    });
  });
});


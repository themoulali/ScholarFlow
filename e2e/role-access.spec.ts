import "dotenv/config";
import { test, expect, Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

async function createRoleSession(page: Page, role: UserRole) {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured for E2E tests.");
  }

  const token = await encode({
    secret,
    maxAge: 60 * 60,
    token: {
      sub: `e2e-${role.toLowerCase()}-user`,
      id: `e2e-${role.toLowerCase()}-user`,
      name: `E2E ${role}`,
      email: `e2e-${role.toLowerCase()}@example.com`,
      role,
    },
  });

  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 3600,
    },
  ]);
}

test.describe("ScholarFlow authenticated role access", () => {
  test("student is redirected from instructor and admin dashboards", async ({
    page,
  }) => {
    await createRoleSession(page, "STUDENT");

    await page.goto("/instructor", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/student$/);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/student$/);
  });

  test("instructor is redirected from student and admin dashboards", async ({
    page,
  }) => {
    await createRoleSession(page, "INSTRUCTOR");

    await page.goto("/student", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/instructor$/);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/instructor$/);
  });

  test("admin is redirected from student and instructor dashboards", async ({
    page,
  }) => {
    await createRoleSession(page, "ADMIN");

    await page.goto("/student", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/instructor", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin$/);
  });
});

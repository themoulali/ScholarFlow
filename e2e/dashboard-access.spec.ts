import { test, expect } from "@playwright/test";

test.describe("ScholarFlow dashboard access control", () => {
  test("redirects unauthenticated users from the student dashboard", async ({
    page,
  }) => {
    await page.goto("/student");

    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from the instructor dashboard", async ({
    page,
  }) => {
    await page.goto("/instructor");

    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from the admin dashboard", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
  });
});
import { test, expect } from "@playwright/test";

test.describe("ScholarFlow registration", () => {
  test("displays the registration form correctly", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Join ScholarFlow" })
    ).toBeVisible();

    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Register As")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Create Account" })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/login");
  });

  test("uses Student as the default registration role", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    await expect(page.getByLabel("Register As")).toHaveValue("STUDENT");
  });

  test("allows selecting Instructor role", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    await page.getByLabel("Register As").selectOption("INSTRUCTOR");

    await expect(page.getByLabel("Register As")).toHaveValue("INSTRUCTOR");
  });

  test("enforces required fields and minimum password length", async ({
    page,
  }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email Address").fill("test@example.com");
    await page.getByLabel("Password").fill("short");

    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByLabel("Password")).toBeFocused();
  });

  test("shows success message after successful registration", async ({
    page,
  }) => {
    let apiIntercepted = false;

    await page.route("**/api/register**", async (route) => {
      apiIntercepted = true;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Registration successful",
        }),
      });
    });

    await page.goto("/register");

    await page.getByLabel("Full Name").fill("E2E Test Student");
    await page.getByLabel("Email Address").fill("e2e-student@example.com");
    await page.getByLabel("Password").fill("TestPassword123!");

    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Registration successful! Redirecting to login...",
      { timeout: 10000 }
    );

    expect(apiIntercepted).toBe(true);
  });
});

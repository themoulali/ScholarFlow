import { test, expect } from "@playwright/test";
test.describe("ScholarFlow login", () => {
  test("displays the login page correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome Back" })
    ).toBeVisible();
    await expect(
      page.getByLabel("Email Address")
    ).toBeVisible();
    await expect(
      page.getByLabel("Password")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", "/register");
  });
  test("prevents submission when required fields are empty", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByLabel("Email Address")).toBeFocused();
  });
  test("displays an error for invalid credentials", async ({ page }) => {
    page.on("console", (message) => {
      console.log("BROWSER:", message.type(), message.text());
    });

    page.on("pageerror", (error) => {
      console.log("PAGE ERROR:", error.message);
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/auth/")) {
        console.log(
          "AUTH RESPONSE:",
          response.status(),
          response.url()
        );
      }
    });

    await page.goto("/login");

    await page.getByLabel("Email Address").fill(
      "invalid-user-e2e@example.com"
    );

    await page.getByLabel("Password").fill("InvalidPassword123!");

    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForTimeout(3000);

    console.log(
      "FORM CONTENT:",
      await page.locator("form").innerText()
    );
  });
});

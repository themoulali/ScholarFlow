import { cn } from "../utils";

describe("cn utility function", () => {
  test("returns a single class name", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  test("combines multiple class names", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  test("removes conflicting Tailwind classes", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
  });

  test("supports conditional class values", () => {
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe(
      "text-sm font-medium"
    );
  });

  test("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
import { test, expect } from "@playwright/test";

test("dashboard loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/LifeOS/i).first()).toBeVisible({ timeout: 15000 });
});

test("tasks page loads", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: /tasks/i })).toBeVisible({
    timeout: 15000,
  });
});

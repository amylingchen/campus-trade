import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";

const cleanupScript = "scripts/cleanup-test-data.mjs";
const backendCwd = "D:\\Data\\LingLing\\workdata\\hackson\\backend";
const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function cleanupTestData() {
  execFileSync("node", [cleanupScript], {
    cwd: backendCwd,
    stdio: "inherit",
  });
}

async function clearBrowserSession(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

async function login(page, email, password = "password123") {
  await page.goto("/auth/login");
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/marketplace/);
}

test.describe.serial("full journey from logged-out visitor with cleanup", () => {
  const stamp = Date.now();
  const newUser = {
    name: "E2E Flow Student",
    email: `e2e-${stamp}@mavs.uta.edu`,
    password: "password123",
  };
  const listing = {
    title: `E2E Raspberry Kit ${stamp}`,
    url: "",
  };

  test.beforeAll(() => {
    cleanupTestData();
  });

  test.afterAll(() => {
    cleanupTestData();
  });

  test("logged-out visitor can browse public pages and is routed away from protected pages", async ({ page }) => {
    await clearBrowserSession(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "UTA marketplace" })).toBeVisible();

    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: "Find campus items" })).toBeVisible();
    await expect(page.getByText("Raspberry Pi 4 Kit")).toBeVisible();

    await page.goto("/courses");
    await expect(page.getByRole("heading", { name: "Find supplies by course" })).toBeVisible();

    await page.goto("/listings/listing_1");
    await expect(page.getByRole("heading", { name: "Raspberry Pi 4 Kit" })).toBeVisible();
    await expect(page.getByText("Log in with your school account")).toBeVisible();

    await page.goto("/listings/new");
    await expect(page).toHaveURL(/\/auth\/login/);

    for (const protectedPath of ["/chats", "/me", "/me/listings", "/me/favorites"]) {
      await clearBrowserSession(page);
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    }
  });

  test("new user registers, verifies, uploads an image, and creates a listing", async ({ page }) => {
    await clearBrowserSession(page);

    await page.goto("/auth/register");
    await page.getByPlaceholder("Full name").fill(newUser.name);
    await page.getByPlaceholder("name@mavs.uta.edu").fill(newUser.email);
    await page.getByPlaceholder("Password").fill(newUser.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/verify-school/);
    await page.getByRole("button", { name: "Send code" }).click();
    const codeText = await page.getByText(/Local dev code:/).textContent();
    const code = codeText.match(/\d{6}/)?.[0];
    expect(code).toBeTruthy();
    await page.getByPlaceholder("123456").fill(code);
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("School email verified.")).toBeVisible();

    await page.goto("/listings/new");
    await page.locator('[name="title"]').fill(listing.title);
    await page.locator('[name="price"]').fill("55");
    await page.locator('[name="location"]').fill("ERB lobby");
    await page.locator('[name="usageType"]').selectOption("course_required");
    await page.locator('[name="courseCodes"]').fill("CSE 3442");
    await page.locator('[name="isCourseRelated"]').check();
    await page.locator('input[type="file"]').setInputFiles({
      name: "e2e-upload.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
    await page.locator('[name="description"]').fill("End-to-end test listing that should be cleaned after the run.");
    await page.getByRole("button", { name: "Publish listing" }).click();

    await expect(page.getByRole("heading", { name: listing.title })).toBeVisible();
    listing.url = page.url();

    await page.goto("/me/listings");
    await expect(page.getByText(listing.title)).toBeVisible();
  });

  test("seeded buyer and new seller can exchange messages about the new listing", async ({ page }) => {
    expect(listing.url).toContain("/listings/");
    await clearBrowserSession(page);

    await login(page, "maya@mavs.uta.edu");
    await page.goto(listing.url);
    await expect(page.getByRole("heading", { name: listing.title })).toBeVisible();
    await page.getByRole("button", { name: "Message Seller" }).click();
    await expect(page).toHaveURL(/\/chats\//);

    const buyerMessage = `Hi, is this available? ${stamp}`;
    await page.getByPlaceholder("Type message...").fill(buyerMessage);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(buyerMessage)).toBeVisible();

    await clearBrowserSession(page);
    await login(page, newUser.email, newUser.password);
    await page.goto("/chats");
    await expect(page.getByText(listing.title)).toBeVisible();
    await page.getByText(listing.title).click();
    await expect(page.getByText(buyerMessage)).toBeVisible();

    const sellerReply = `Yes, meet at ERB. ${stamp}`;
    await page.getByPlaceholder("Type message...").fill(sellerReply);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(sellerReply)).toBeVisible();
  });
});

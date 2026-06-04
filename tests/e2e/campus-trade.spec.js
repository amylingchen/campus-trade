import { test, expect } from "@playwright/test";

const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

test("visitor can open home and marketplace with live listings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "UTA marketplace" })).toBeVisible();
  await expect(page.locator("#school-select")).toHaveValue("school_uta");
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: "Find campus items" })).toBeVisible();
  await expect(page.locator("article")).not.toHaveCount(0);
});

test("mobile marketplace keeps search visible and uses compact sort filter controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/marketplace");
  const mobileSearch = page.getByPlaceholder("Search Raspberry Pi, textbook, bike...").first();
  await expect(mobileSearch).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sort" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
  await mobileSearch.fill("Raspberry");
  await expect(page.locator("article").first()).toBeVisible();
});

test("visitor can open seller profile from listing detail", async ({ page }) => {
  await page.goto("/listings/listing_1");
  await page.getByRole("link", { name: "Alex Chen" }).click();
  await expect(page).toHaveURL(/\/profile\/user_1/);
  await expect(page.getByRole("heading", { name: "Alex Chen", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Items from Alex Chen" })).toBeVisible();
  await expect(page.getByText("Raspberry Pi 4 Kit")).toBeVisible();
});

test("verified user can log in, create listing with image, see it in my listings, and mark sold", async ({ page }) => {
  const title = `Playwright Pi ${Date.now()}`;
  await page.goto("/auth/login");
  await page.getByPlaceholder("maya@mavs.uta.edu").fill("maya@mavs.uta.edu");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/marketplace/);

  await page.goto("/listings/new");
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="price"]').fill("42");
  await page.locator('[name="location"]').fill("Central Library");
  await page.locator('[name="usageType"]').selectOption("course_required");
  await page.locator('[name="courseCodes"]').fill("CSE 3442");
  await page.locator('input[type="file"]').setInputFiles({
    name: "playwright-upload.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page.locator('[name="description"]').fill("Created by automated Playwright test.");
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/me/listings");
  await expect(page.getByText(title)).toBeVisible();

  await page.getByText(title).click();
  await page.getByRole("button", { name: "Mark sold" }).click();
  await expect(page.getByText("sold")).toBeVisible();
});

test("buyer can favorite item, start chat, and send message", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByPlaceholder("maya@mavs.uta.edu").fill("maya@mavs.uta.edu");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/marketplace/);
  await page.goto("/marketplace");
  await page.getByText("Raspberry Pi 4 Kit").first().click();
  const saveButton = page.getByRole("button", { name: /^(Save|Saved)$/ });
  if (await page.getByRole("button", { name: "Saved" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Saved" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  }
  await saveButton.click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  await page.getByRole("button", { name: "Saved" }).click();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  const conversationResponse = page.waitForResponse((response) =>
    response.url().includes("/api/conversations") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Message Seller" }).click();
  await conversationResponse;
  await expect(page).toHaveURL(/\/chats\//);
  await expect(page.getByRole("link", { name: /Raspberry Pi 4 Kit/ })).toHaveAttribute("href", /\/listings\/listing_1/);
  await expect(page.getByRole("link", { name: /Alex Chen/ })).toHaveAttribute("href", /\/profile\/user_1/);
  await expect(page.getByPlaceholder("Type message...")).toBeVisible();
  const message = `Playwright hello ${Date.now()}`;
  await page.getByPlaceholder("Type message...").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(message)).toBeVisible();
});

test("new user can register and verify school email with dev code", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/auth/register");
  await page.getByPlaceholder("Full name").fill("Playwright Student");
  await page.getByPlaceholder("name@mavs.uta.edu").fill(`playwright-${stamp}@mavs.uta.edu`);
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-school/);
  await page.getByRole("button", { name: "Send code" }).click();
  const codeText = await page.getByText(/Local dev code:/).textContent();
  const code = codeText.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByPlaceholder("123456").fill(code);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("School email verified.")).toBeVisible();
});

test("course search opens course listings", async ({ page }) => {
  await page.goto("/courses");
  await page.getByPlaceholder("Search CSE 3442, PHYS 1444...").fill("CSE");
  await expect(page.getByText("CSE 3442")).toBeVisible();
  await page.getByText("CSE 3442").click();
  await expect(page).toHaveURL(/\/courses\/CSE%203442/);
  await expect(page.getByRole("heading", { name: "CSE 3442" })).toBeVisible();
});

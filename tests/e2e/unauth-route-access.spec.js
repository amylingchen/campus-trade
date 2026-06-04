import { expect, test } from "@playwright/test";

const publicRoutes = [
  { id: "UA-001", path: "/", heading: /UTA marketplace/i, owner: "frontend-prototype-designer" },
  { id: "UA-002", path: "/auth/login", heading: /Log in/i, owner: "frontend-prototype-designer" },
  { id: "UA-003", path: "/auth/register", heading: /Create account/i, owner: "frontend-prototype-designer" },
  { id: "UA-004", path: "/marketplace", heading: /Find campus items/i, owner: "frontend-prototype-designer" },
  { id: "UA-005", path: "/listings/listing_1", heading: /Raspberry Pi 4 Kit/i, owner: "frontend-prototype-designer/backend-api-builder" },
  { id: "UA-006", path: "/courses", heading: /Find supplies by course/i, owner: "frontend-prototype-designer" },
  { id: "UA-007", path: "/courses/CSE%203442", heading: /CSE 3442/i, owner: "frontend-prototype-designer/backend-api-builder" },
  { id: "UA-008", path: "/profile/user_1", heading: /Alex Chen/i, owner: "frontend-prototype-designer/backend-api-builder" },
];

const protectedRoutes = [
  { id: "UA-101", path: "/verify-school", owner: "frontend-prototype-designer" },
  { id: "UA-102", path: "/listings/new", owner: "frontend-prototype-designer" },
  { id: "UA-103", path: "/listings/listing_1/edit", owner: "frontend-prototype-designer" },
  { id: "UA-104", path: "/chats", owner: "frontend-prototype-designer" },
  { id: "UA-105", path: "/chats/conversation_unauth_probe", owner: "frontend-prototype-designer" },
  { id: "UA-106", path: "/me", owner: "frontend-prototype-designer" },
  { id: "UA-107", path: "/me/listings", owner: "frontend-prototype-designer" },
  { id: "UA-108", path: "/me/favorites", owner: "frontend-prototype-designer" },
];

const unknownRoutes = [
  { id: "UA-201", path: "/does-not-exist", owner: "frontend-prototype-designer" },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

for (const route of publicRoutes) {
  test(`${route.id} logged-out visitor can open public route ${route.path}`, async ({ page }) => {
    const failures = [];
    page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`console error: ${message.text()}`);
    });

    await page.goto(route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    expect(failures, `${route.id} owner: ${route.owner}`).toEqual([]);
  });
}

for (const route of protectedRoutes) {
  test(`${route.id} logged-out visitor is redirected from protected route ${route.path}`, async ({ page }) => {
    const failures = [];
    page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));

    await page.goto(route.path);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole("heading", { name: /Log in/i })).toBeVisible();
    expect(failures, `${route.id} owner: ${route.owner}`).toEqual([]);
  });
}

for (const route of unknownRoutes) {
  test(`${route.id} logged-out visitor unknown route falls back safely ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /UTA marketplace/i })).toBeVisible();
  });
}

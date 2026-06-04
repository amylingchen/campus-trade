import fs from "node:fs/promises";
import path from "node:path";

const API = process.env.API_BASE_URL ?? "http://localhost:4000/api";
const WEB = process.env.WEB_BASE_URL ?? "http://localhost:5173";
const results = [];

function record(id, scenario, result, owner, evidence) {
  results.push({ id, scenario, result, owner, evidence });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(pathname, options = {}) {
  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function runCase(id, scenario, owner, fn) {
  try {
    const evidence = await fn();
    record(id, scenario, "PASS", owner, evidence);
  } catch (error) {
    record(id, scenario, "FAIL", owner, `${error.message}${error.payload ? ` ${JSON.stringify(error.payload)}` : ""}`);
  }
}

const unique = Date.now();
let token = "";
let user = null;
let createdProductId = "";
let sellerToken = "";
let uploadedImageUrl = "";

await runCase("API-001", "Health check", "backend-api-builder", async () => {
  const payload = await jsonRequest("/health");
  assert(payload.data.ok === true, "health ok should be true");
  return "GET /health returned ok";
});

await runCase("API-002", "School list includes UTA", "backend-api-builder", async () => {
  const payload = await jsonRequest("/schools");
  assert(payload.data.some((school) => school.id === "school_uta" && school.isActive), "UTA active school missing");
  return `schools=${payload.data.length}`;
});

await runCase("API-003", "Register and verify student", "backend-api-builder", async () => {
  const email = `autotest-${unique}@mavs.uta.edu`;
  const register = await jsonRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Auto Test", email, password: "password123", schoolId: "school_uta" }),
  });
  token = register.data.token;
  user = register.data.user;
  const send = await jsonRequest("/verification/send-code", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email }),
  });
  assert(send.data.devCode, "devCode missing in local test environment");
  const confirm = await jsonRequest("/verification/confirm-code", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code: send.data.devCode }),
  });
  assert(confirm.data.verifiedStudent === true, "user not verified");
  return `verified user=${user.id}`;
});

await runCase("API-004", "Reject invalid school email", "backend-api-builder", async () => {
  try {
    await jsonRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Bad Email", email: `bad-${unique}@gmail.com`, password: "password123", schoolId: "school_uta" }),
    });
  } catch (error) {
    assert(error.status === 400, "expected 400 validation error");
    return "invalid email rejected with 400";
  }
  throw new Error("invalid email registration unexpectedly succeeded");
});

await runCase("API-005", "Login seeded user", "backend-api-builder", async () => {
  const login = await jsonRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "maya@mavs.uta.edu", password: "password123" }),
  });
  sellerToken = login.data.token;
  assert(login.data.user.verifiedStudent === true, "seeded user should be verified");
  return `seeded user=${login.data.user.id}`;
});

await runCase("API-006", "Product browse filters", "backend-api-builder", async () => {
  const products = await jsonRequest("/products?schoolId=school_uta&q=raspberry&courseCode=CSE%203442");
  assert(Array.isArray(products.data), "products data should be array");
  return `filtered products=${products.data.length}`;
});

await runCase("API-007", "Upload image", "backend-api-builder", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
  const formData = new FormData();
  formData.append("image", new Blob([png], { type: "image/png" }), "auto-test.png");
  const upload = await jsonRequest("/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  assert(upload.data.imageUrl.startsWith("/uploads/"), "upload did not return upload URL");
  uploadedImageUrl = upload.data.imageUrl;
  const asset = await fetch(`${API.replace(/\/api$/, "")}${upload.data.imageUrl}`);
  assert(asset.ok, "uploaded image not reachable via frontend origin");
  return uploadedImageUrl;
});

await runCase("API-008", "Create course-related listing", "backend-api-builder", async () => {
  const payload = {
    title: `Auto Pi Kit ${unique}`,
    description: "Automated test listing with uploaded image and course code.",
    price: 31,
    category: "course_materials",
    usageType: "course_required",
    condition: "good",
    location: "Central Library",
    negotiable: true,
    isCourseRelated: true,
    courseCodes: ["CSE 3442"],
    images: [{ imageUrl: uploadedImageUrl, sortOrder: 1 }],
  };
  const created = await jsonRequest("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  createdProductId = created.data.id;
  assert(createdProductId, "created product id missing");
  return createdProductId;
});

await runCase("API-009", "Product detail includes images and courses", "backend-api-builder", async () => {
  const detail = await jsonRequest(`/products/${createdProductId}`);
  assert(detail.data.images.length > 0, "images missing");
  assert(detail.data.courseCodes.includes("CSE 3442"), "course code missing");
  return `detail title=${detail.data.title}`;
});

await runCase("API-010", "Favorite item", "backend-api-builder", async () => {
  await jsonRequest(`/favorites/${createdProductId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const favorites = await jsonRequest("/favorites", { headers: { Authorization: `Bearer ${sellerToken}` } });
  assert(favorites.data.some((item) => item.id === createdProductId), "favorite not listed");
  return `favorites=${favorites.data.length}`;
});

await runCase("API-011", "Conversation and messages", "backend-api-builder", async () => {
  const conversation = await jsonRequest("/conversations", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ productId: createdProductId }),
  });
  const detail = await jsonRequest(`/conversations/${conversation.data.id}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(detail.data.otherUser?.verifiedStudent === true, "conversation detail missing verified other user");
  const message = await jsonRequest(`/conversations/${conversation.data.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ content: "Automated test message" }),
  });
  const messages = await jsonRequest(`/conversations/${conversation.data.id}/messages`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(messages.data.some((item) => item.id === message.data.id), "message not returned");
  assert(messages.data.some((item) => item.sender?.name), "message sender metadata missing");
  await jsonRequest(`/conversations/${conversation.data.id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ readUntilMessageId: message.data.id }),
  });
  return `conversation=${conversation.data.id}`;
});

await runCase("API-012", "Own listing conversation conflict", "backend-api-builder", async () => {
  try {
    await jsonRequest("/conversations", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: createdProductId }),
    });
  } catch (error) {
    assert(error.status === 409, "expected own product conflict");
    return "own listing conflict returned 409";
  }
  throw new Error("own listing conversation unexpectedly succeeded");
});

await runCase("API-013", "Report item", "backend-api-builder", async () => {
  const report = await jsonRequest("/reports", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ productId: createdProductId, reportedUserId: user.id, reason: "test_report", detail: "Automated report test" }),
  });
  assert(report.data.status === "open", "report status should be open");
  return `report=${report.data.id}`;
});

await runCase("API-014", "Seller profile and user products", "backend-api-builder", async () => {
  const profile = await jsonRequest(`/users/${user.id}/profile`);
  assert(profile.data.id === user.id, "profile returned wrong user");
  assert(profile.data.email === undefined, "profile must not expose email");
  assert(profile.data.stats.activeListingCount >= 1, "profile active listing count missing");
  const userProducts = await jsonRequest(`/users/${user.id}/products?status=available,pending,sold`);
  assert(userProducts.data.some((item) => item.id === createdProductId), "user products missing created product");
  return `profile=${profile.data.name}, products=${userProducts.data.length}`;
});

await fs.mkdir("test-results", { recursive: true });
await fs.writeFile(path.join("test-results", "api-smoke-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

const failures = results.filter((result) => result.result === "FAIL");
console.table(results);
if (failures.length > 0) process.exitCode = 1;

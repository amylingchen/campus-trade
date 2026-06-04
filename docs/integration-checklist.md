# Integration Checklist

## Contract Summary

- Frontend reads and writes API JSON using camelCase.
- Backend stores MySQL columns in snake_case and converts to camelCase responses.
- API base URL: `http://localhost:4000/api`.
- Frontend dev origin: `http://localhost:5173`.
- Auth uses `Authorization: Bearer <token>`.
- Real-time messaging uses the same JWT on Socket.io/WebSocket connection.
- Visitors can browse schools and products.
- Verified users can create listings, favorite, chat, and report.
- Home page should now be a simple marketplace page with school dropdown, not a marketing landing page.

## Planned Skill Handoff

Current assigned task batch lives in `docs/task-handoff.md`. Use it as the implementation checklist for the real-time chat, seller profile, marketplace home, and school switching redesign.

### 1. Frontend Prototype Designer

Input files:

- `docs/product-requirements.md`
- `docs/frontend-spec.md`
- `docs/backend-api.md`

Expected work:

- Build React + Tailwind routes from `docs/frontend-spec.md`.
- Use mock data first.
- Create API client placeholders matching `docs/backend-api.md`.
- Implement marketplace, listing detail, listing form, course search, chats, account, auth, and verification screens.
- Update this checklist with created client functions, route paths, fields consumed, and any UI-only mock fields.

### 2. Backend API Builder

Input files:

- `docs/backend-api.md`
- `docs/database-schema.md`
- `docs/product-requirements.md`

Expected work:

- Build Node.js + Express + MySQL API.
- Implement auth, school verification, products, favorites, courses, conversations, messages, and reports.
- Implement CRUD, validation, centralized errors, CORS, and documented response shapes.
- Add schema/migrations and seed data.
- Update this checklist with implemented endpoints, environment variables, CORS origin, and any contract deviations.

### 3. Integration Tester

Input files:

- `docs/product-requirements.md`
- `docs/frontend-spec.md`
- `docs/backend-api.md`
- `docs/database-schema.md`
- `docs/integration-checklist.md`

Expected work:

- Compare frontend API clients against backend Express routes.
- Compare frontend socket events against backend Socket.io/WebSocket handlers.
- Compare mock data fields against API responses and database mappings.
- Verify request/response formats, auth header usage, CORS origin, enum values, and error shapes.
- Fix clear mismatches directly.
- Record remaining questions under Open Questions.

## Contract Items To Check

- `GET /api/products` supports all frontend filters.
- `GET /api/products/:id` returns all fields listing detail consumes.
- `POST /api/products` accepts course codes and images.
- `PATCH /api/products/:id/status` supports `available`, `pending`, `sold`, `removed`.
- Favorites endpoints return or remove expected data.
- Conversations are unique by `productId`, `buyerId`, and `sellerId`.
- Message sender must be current user and conversation participant.
- Auth-gated frontend routes block unverified users from posting, favoriting, chatting, and reporting.
- Backend CORS allows frontend dev origin and Authorization header.
- Error response always uses `{ "error": { "code", "message", "details" } }`.
- Socket authentication uses the same JWT and rejects unverified users from joining/sending conversations.
- `GET /conversations` remains the source for the conversation list and unread counts.
- Chat detail shows `otherUser` identity in header and links to `/profile/:id`.
- Reading/opening a conversation marks incoming messages read.
- Public profile routes expose safe user fields and seller listings without email/password fields.
- Product creation assigns `schoolId` from the verified user's school unless future multi-school permission exists.

## Matched

- Frontend API client placeholders use the documented base URL `http://localhost:4000/api`.
- Frontend routes from `docs/frontend-spec.md` were implemented under `frontend/src/App.jsx`.
- Frontend mock data uses API-shaped camelCase fields for schools, users, products, courses, conversations, and messages.
- Backend routes were implemented under the documented `/api` namespace.
- Backend CORS allows `http://localhost:5173` and the `Authorization` header.
- Backend error responses use `{ "error": { "code", "message", "details" } }`.
- Backend product status endpoint supports `available`, `pending`, `sold`, and `removed`.
- Backend image upload endpoint is available at `POST /api/uploads` and returns an `imageUrl` for product payloads.
- Backend conversations are unique by `product_id`, `buyer_id`, and `seller_id`.

## Fixed

- Created React + Tailwind frontend prototype in `frontend/`.
- Created placeholder API client functions in `frontend/src/lib/api.js`.
- Created Express + MySQL backend in `backend/`.
- Created MySQL schema and seed files in `backend/sql/schema.sql` and `backend/sql/seed.sql`.
- Local school verification is implemented as console-logged codes for development.
- Replaced frontend listing image URL field with a file upload control and local preview.
- Added `uploadProductImage(file)` frontend API client placeholder for multipart uploads.
- Added backend local image upload support with static serving from `/uploads`.
- Wired key frontend screens to real API calls instead of mock-only behavior: login, marketplace product list, product detail, create listing with image upload, favorite, start conversation, conversation list, message list, and send message.
- Created local MySQL database `campus_trade` using `backend/sql/schema.sql`.
- Seeded local MySQL data using `backend/sql/seed.sql`.
- Fixed MySQL product pagination query by using server-validated integer `LIMIT` and `OFFSET` values.
- Fixed seed user password hash so demo users can log in with `password123`.
- Fixed product course attachment so new listings reuse the existing course row selected by `school_id` and `normalized_course_code`.
- Integration Tester finding: registration page used a link and mock school data only, so it never called `POST /api/auth/register`. Owner: frontend-prototype-designer. Fix: wired register form to `registerUser`, persisted token/user, and navigated to verification.
- Integration Tester finding: school verification page used a mock user and never called verification APIs. Owner: frontend-prototype-designer and backend-api-builder. Fix: frontend now calls send/confirm verification; backend returns local `devCode` outside production for testability.
- Integration Tester finding: account, favorites, my listings, courses, and seller profile were mock-only or partial fallbacks. Owner: frontend-prototype-designer. Fix: wired these pages to `getCurrentUser`, `listFavorites`, `listProducts`, and `listCourses`.
- Integration Tester finding: backend had no `sellerId` product filter, blocking real My Listings and seller profile data. Owner: backend-api-builder. Fix: added `sellerId` query support to `GET /api/products`.
- Prototype Test Runner finding: listing form labels were not accessible through label lookup. Owner: frontend-prototype-designer. Fix: added `htmlFor/id` pairs to listing form controls.
- Prototype Test Runner finding: chat navigation was unstable and had no error feedback. Owner: frontend-prototype-designer. Fix: changed `Message Seller` to use React Router `navigate()` and display request errors.
- Prototype Test Runner finding: E2E login test raced token persistence. Owner: prototype-test-runner. Fix: test now waits for login redirect before continuing.
- Prototype Test Runner finding: Playwright HTML report output conflicted with artifact directory. Owner: prototype-test-runner. Fix: moved HTML reporter output to `playwright-report`.
- Prototype Test Runner finding: old automated test products and users accumulated in MySQL. Owner: prototype-test-runner. Fix: added `backend/scripts/cleanup-test-data.mjs` and verified it removes matching messages, conversations, reports, favorites, product course links, images, products, verification rows, and users.
- Prototype Test Runner finding: auth-gated frontend pages fell back to mock user state and allowed logged-out visitors to open protected screens. Owner: frontend-prototype-designer/integration-tester. Fix: added route-level `AuthGuard`, protected Sell/Edit/Chats/Account/Favorites/My Listings/School Verification, removed mock-user fallback from authenticated shell/listing flows, and added listing detail login/verification prompts.
- Backend API Builder task: implemented Socket.io real-time messaging with JWT auth, verified-user enforcement, `conversation:join`, `message:send`, and `message:read` events.
- Backend API Builder task: added `GET /api/conversations/:id`, enriched message history with `sender`, and added optional read-until behavior for `PATCH /api/conversations/:id/read`.
- Backend API Builder task: added public seller profile endpoints `GET /api/users/:id/profile` and `GET /api/users/:id/products`.
- Frontend Prototype Designer task: replaced the homepage with a simple marketplace-first page and school dropdown.
- Frontend Prototype Designer task: added school context to listing creation, locked to the verified user's school for normal student accounts.
- Frontend Prototype Designer task: updated chat detail with other participant identity, profile link, Socket.io send/read behavior, and REST fallback.
- Frontend Prototype Designer task: rebuilt `/profile/:id` as a seller marketplace profile backed by live profile/product APIs.
- Prototype Test Runner task: added socket smoke tests and expanded API/E2E coverage for profile and school dropdown behavior.
- Product Planner follow-up: chat detail product summary and participant identity were separated per annotated screen feedback.
- Frontend Prototype Designer follow-up: chat product summary now links to `/listings/:id`, participant row links to `/profile/:id`, Live/fallback state moved beside participant identity, and composer is pinned at the bottom of the chat panel.
- Prototype Test Runner follow-up: E2E checks now assert chat product link, profile link, and composer visibility.
- Frontend Prototype Designer follow-up: mobile marketplace now uses compact `Search`, `Sort`, and `Filter` controls with expandable panels and denser listing cards.
- Product Planner update: mobile marketplace search must remain visible under the school selector, with `Sort` and `Filter` beside each other below it. Marketplace feeds should request and display available listings only.
- Frontend Prototype Designer follow-up: favorite controls on product cards and listing detail are toggle actions using `POST /api/favorites/:productId` and `DELETE /api/favorites/:productId`.
- Frontend Prototype Designer follow-up: product detail mobile order is title/price, actions, listing info tags, description, then seller.
- Prototype Test Runner follow-up: `tests/e2e/unauth-route-access.spec.js` now covers every route in `frontend/src/App.jsx` while logged out. Public routes open successfully, protected routes redirect to `/auth/login`, and unknown routes fall back to `/`.
- Prototype Test Runner follow-up: added mobile E2E coverage for compact marketplace controls.

## Remaining Mismatches

- `GET /api/products/:id` does not yet compute authenticated `isFavorited`; it returns product details and images.
- `PATCH /api/products/:id` updates core listing fields but does not yet replace images or course codes.
- Some secondary actions still need full live behavior: report button, delete listing button, edit listing image replacement, edit listing course replacement, and home page preview refresh.
- `npm run test:all` is not reliable in this local Windows shell: after `npm run test:api`, Playwright worker startup can fail with `spawn EPERM`. `npm run test:api` and `npm run test:e2e` pass when run separately.

## Open Questions

- Should school verification code be emailed for real in MVP, or logged to the console during local development? Current implementation logs to console.
- Should real-time messaging use Socket.io or native WebSocket? Recommendation for this prototype: Socket.io for reconnects, rooms, and event acknowledgements.
- Should sold listings remain publicly visible in marketplace search, or only visible from seller history and existing chats? Current frontend can display sold listings when filtered or in saved/history-style contexts.
- Should profile show sold listings publicly, or only active listings plus sold count? Recommendation: active listings public; sold count optional.

## Verification

- Frontend dependencies installed with `npm install`.
- Backend dependencies installed with `npm install`.
- Frontend production build passed with `npm run build`.
- Backend JavaScript syntax check passed for all `backend/src/**/*.js`.
- Backend health smoke test passed: `GET http://localhost:4000/api/health` returned `{ "data": { "ok": true, "service": "campus-trade-api" } }`.
- MySQL connection passed against local MySQL 8.0.39.
- `GET /api/schools` returned the seeded UTA school.
- `GET /api/courses?schoolId=school_uta` returned seeded UTA courses.
- `GET /api/products?schoolId=school_uta` returned seeded products with pagination.
- `GET /api/products?schoolId=school_uta&sellerId=<userId>` returned current seller listings.
- `POST /api/auth/login` passed for `maya@mavs.uta.edu` with demo password.
- `POST /api/auth/register` passed for a new `@mavs.uta.edu` user.
- `POST /api/verification/send-code` returned local `devCode`; `POST /api/verification/confirm-code` verified the new user.
- Authenticated favorite creation passed for `POST /api/favorites/listing_1`.
- Authenticated favorites list passed for `GET /api/favorites`.
- Authenticated conversations list passed for `GET /api/conversations`.
- Authenticated conversation creation passed for `POST /api/conversations`.
- Authenticated message send and read passed for `POST /api/conversations/:id/messages` and `GET /api/conversations/:id/messages`.
- Authenticated product creation passed for a course-related listing.
- Course listing lookup passed for `GET /api/courses/CSE%203442/products`.
- Authenticated image upload passed for `POST /api/uploads` with multipart `image`.
- Uploaded image static serving passed at `/uploads/<filename>`.
- Frontend dev server returned HTTP 200 at `http://localhost:5173`.
- Frontend build passed after live API wiring with `npm run build`.
- Frontend build passed after auth guard changes with `npm run build`.
- Prototype Test Runner generated `docs/test-plan.md`.
- API automated smoke suite passed: 13/13.
- Playwright Chromium E2E suite passed: 8/8 with one worker.
- API automated smoke suite passed after real-time/profile backend work: 14/14.
- Socket smoke suite passed: 1/1.
- Playwright Chromium E2E suite passed after marketplace/profile/chat frontend work: 9/9.
- Focused Playwright E2E suite passed after chat detail refinement: 6/6 for `tests/e2e/campus-trade.spec.js`.
- Focused Playwright E2E suite passed after mobile marketplace refinement: 7/7 for `tests/e2e/campus-trade.spec.js`.
- Logged-out/new-user/two-user Playwright journey verified protected route redirects and passed.
- Automated cleanup removed previous test data and final cleanup returned zero remaining matching rows.
- `npm run test:all` reproduced `spawn EPERM` after the API script; API and E2E were verified as separate commands.
- Test report written to `docs/test-report.md`.

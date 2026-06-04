# Test Report

## Summary

Automated tests were generated from the product requirements, frontend spec, backend API contract, database schema, and integration checklist. The suite now includes direct API smoke tests and Playwright browser E2E tests.

Latest targeted run:

- API smoke tests: 14 passed, 0 failed
- Socket smoke tests: 1 passed, 0 failed
- Full Playwright E2E tests: 9 passed, 0 failed
- Logged-out route access Playwright tests: 17 passed, 0 failed
- Cleanup verification: previous and current automated test database rows removed; final cleanup returned 0 rows affected
- Frontend build: passed

Previous regression baseline:

- Playwright E2E tests: 5 passed, 0 failed

## Environment

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Database: local MySQL `campus_trade`
- Browser runner: Playwright Chromium
- Demo user: `maya@mavs.uta.edu` / `password123`

## Test Results

| ID | Scenario | Result | Owner | Evidence |
| --- | --- | --- | --- | --- |
| API-001 | Health check | PASS | backend-api-builder | `GET /api/health` returned ok |
| API-002 | School list includes UTA | PASS | backend-api-builder | `GET /api/schools` returned active UTA |
| API-003 | Register and verify student | PASS | backend-api-builder | New `@mavs.uta.edu` user registered and verified with `devCode` |
| API-004 | Reject invalid school email | PASS | backend-api-builder | Non-school email rejected with 400 |
| API-005 | Login seeded user | PASS | backend-api-builder | Demo user returned token and verified profile |
| API-006 | Product browse filters | PASS | backend-api-builder | Product filters returned matching data |
| API-007 | Upload image | PASS | backend-api-builder | Multipart upload returned `/uploads/...` URL and static asset was reachable |
| API-008 | Create course-related listing | PASS | backend-api-builder | Verified user created listing with course code and image |
| API-009 | Product detail includes images and courses | PASS | backend-api-builder | Detail returned images and `CSE 3442` |
| API-010 | Favorite item | PASS | backend-api-builder | Favorite created and appeared in favorites list |
| API-011 | Conversation and messages | PASS | backend-api-builder | Conversation created, message sent, message returned |
| API-012 | Own listing conversation conflict | PASS | backend-api-builder | Own-product chat returned 409 |
| API-013 | Report item | PASS | backend-api-builder | Report created with `open` status |
| API-014 | Seller profile and user products | PASS | backend-api-builder | Public seller profile returned safe fields and user products included created listing |
| SOCKET-001 | Real-time message and read event | PASS | backend-api-builder | Socket.io join, send, ack, `message:new`, read event, and REST history persistence passed |
| UI-001 | Visitor opens home and marketplace | PASS | frontend-prototype-designer | Marketplace rendered live listing cards |
| UI-001A | School dropdown on marketplace home | PASS | frontend-prototype-designer | Home school selector defaulted to `school_uta` |
| UI-001B | Seller profile opens from listing detail | PASS | frontend-prototype-designer | Seller link opened `/profile/user_1` and showed active listing |
| UI-002 | Login, create listing with image, my listings, mark sold | PASS | frontend-prototype-designer | Playwright created listing, found it in My Listings, marked sold |
| UI-003 | Favorite item, start chat, send message | PASS | frontend-prototype-designer | Playwright opened chat and sent message |
| UI-004 | Register and verify school email | PASS | frontend-prototype-designer/backend-api-builder | Playwright used local `devCode` and saw verification success |
| UI-005 | Course search opens course listings | PASS | frontend-prototype-designer | Search found `CSE 3442` and opened course listing page |
| UI-006 | Logged-out page tour and protected route check | PASS | frontend-prototype-designer/integration-tester | Visitor opened public pages; `/listings/new`, `/chats`, `/me`, `/me/listings`, and `/me/favorites` redirected to login |
| UI-009A | Full logged-out route access matrix | PASS | frontend-prototype-designer/integration-tester | `tests/e2e/unauth-route-access.spec.js` verified 8 public routes open, 8 protected routes redirect to `/auth/login`, and unknown routes fall back to `/` |
| UI-007 | New user full seller flow | PASS | frontend-prototype-designer/backend-api-builder | New `e2e-...@mavs.uta.edu` user registered, verified, uploaded image, created listing, and saw it in My Listings |
| UI-008 | Two-user interaction | PASS | frontend-prototype-designer/backend-api-builder/integration-tester | `maya@mavs.uta.edu` messaged the new seller; new seller opened Chats and replied |
| OPS-001 | Cleanup previous and current automated test data | PASS | prototype-test-runner | Initial cleanup removed 7 previous test products and 8 test users; final cleanup returned 0 rows affected |

## Failures Found During Test Development

### T-001: Listing form labels were not associated with form controls

- Severity: P2
- Owner: frontend-prototype-designer
- Expected: Playwright `getByLabel("Title")` should locate the title input.
- Actual: Labels were plain text without `htmlFor/id`, so accessible label lookup failed.
- Evidence: Initial Playwright run timed out waiting for `getByLabel("Title")`.
- Fix applied: Added `htmlFor` and matching `id` attributes in `frontend/src/components/ListingForm.jsx`.

### T-002: Chat navigation used hard browser navigation and lacked error feedback

- Severity: P2
- Owner: frontend-prototype-designer
- Expected: `Message Seller` should navigate to `/chats/:id` after `POST /api/conversations`.
- Actual: Initial E2E was unstable around chat navigation and had no UI error fallback.
- Evidence: Initial Playwright run stayed on `/listings/listing_1`.
- Fix applied: Replaced `window.location.href` with React Router `navigate()` and added error handling in `frontend/src/pages/ListingDetailPage.jsx`.

### T-003: E2E login test did not wait for token persistence before navigating

- Severity: P3
- Owner: prototype-test-runner
- Expected: Test should wait for login redirect before continuing.
- Actual: Test navigated to marketplace immediately after clicking login, racing localStorage token persistence.
- Evidence: Chat request could run without the expected auth token.
- Fix applied: Added `await expect(page).toHaveURL(/\/marketplace/)` after login in `tests/e2e/campus-trade.spec.js`.

### T-004: Playwright HTML reporter path conflicted with artifact output folder

- Severity: P3
- Owner: prototype-test-runner
- Expected: HTML report output should not be inside the test artifact root.
- Actual: Playwright warned that HTML reporter could clear artifacts.
- Evidence: Playwright configuration warning on first E2E run.
- Fix applied: Moved HTML report folder to `playwright-report`.

### T-005: Unauthenticated visitor can open the Sell page form

- Severity: P2
- Owner: frontend-prototype-designer/integration-tester
- Expected: Auth-gated frontend routes should block unauthenticated or unverified users from posting flows before they reach the publish form.
- Actual: `/listings/new` renders the full Sell form while logged out because the shell and listing form page fall back to mock `currentUser`.
- Evidence: `tests/e2e/full-journey-cleanup.spec.js` opened `/listings/new` after clearing `localStorage` and found `Sell an item` plus `Publish listing`.
- Fix applied: Added `AuthGuard`, removed mock-user fallback from authenticated shell/listing flows, protected Sell, Edit, Chats, Account, Favorites, My Listings, and School Verification routes, and updated listing detail actions to show login/verification prompts before protected actions.
- Verification: `npm run build` passed; `npm run test:e2e` passed 8/8; `npm run test:api` passed 13/13.

### T-006: Cleanup script initially missed product conversations

- Severity: P3
- Owner: prototype-test-runner
- Expected: Test cleanup should remove previous automated products and all dependent rows.
- Actual: The first cleanup attempt used prepared `execute` with array `IN (?)`, so product conversations were not selected and product deletion hit a foreign key constraint.
- Evidence: MySQL returned `ER_ROW_IS_REFERENCED_2` for `fk_conversations_product`.
- Fix applied: Changed cleanup ID selection to use MySQL `query`, then removed conversations, messages, reports, favorites, course links, images, products, verification rows, and test users in dependency order.

## Not Run

- Mobile viewport E2E regression.
- Cross-browser tests beyond Chromium.
- Deployed GitHub Pages/Railway route matrix; the new logged-out access matrix was run against local `http://localhost:5173`.
- `npm run test:all` as a single chained command is currently unreliable in this Windows shell because Playwright worker startup fails with `spawn EPERM` after the API script. The same API and E2E commands pass when run separately.
- Full edit-listing replacement of images and course codes.
- Delete listing UI action.
- Report button UI action.
- Accessibility audit beyond form label lookup.

## Follow-up Recommendations

- Add automated tests for delete listing and report listing once those buttons are wired.
- Add mobile viewport Playwright project.
- Add API cleanup or isolated test database reset to every test file to prevent test-created listings from accumulating.
- Replace `npm run test:all` with a Windows-safe orchestration script or CI runner that avoids the local `spawn EPERM` issue.

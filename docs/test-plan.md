# Prototype Test Plan

## Scope

This plan validates the Campus Trade MVP against the product requirements, frontend route map, backend API contract, database schema, and integration checklist.

## Environment

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Database: local MySQL `campus_trade`
- Demo user: `maya@mavs.uta.edu` / `password123`
- Local verification uses `devCode` from `POST /api/verification/send-code`

## Test Matrix

| ID | Type | Scenario | Requirement | Expected Result | Failure Owner |
| --- | --- | --- | --- | --- | --- |
| API-001 | API | Health check | Backend API available | `GET /health` returns `{ ok: true }` | backend-api-builder |
| API-002 | API | School list | UTA community exists | `GET /schools` returns active UTA school | backend-api-builder |
| API-003 | API | Register and verify student | School authentication | New `@mavs.uta.edu` user can register, receive `devCode`, and verify | backend-api-builder |
| API-004 | API | Reject invalid school email | School authentication | Non-UTA email registration returns validation error | backend-api-builder |
| API-005 | API | Login seeded user | Auth | Demo user receives token and verified profile | backend-api-builder |
| API-006 | API | Product browse filters | Marketplace | `GET /products` supports school, q, course, seller filters | backend-api-builder |
| API-007 | API | Upload image | Listing creation | Multipart image upload returns `/uploads/...` URL and static asset is reachable | backend-api-builder |
| API-008 | API | Create course-related listing | Seller flow | Verified user can create listing with image and course code | backend-api-builder |
| API-009 | API | Product detail | Listing detail | Detail returns product images and course tags | backend-api-builder |
| API-010 | API | Favorite item | Buyer flow | Verified user can favorite and list favorites | backend-api-builder |
| API-011 | API | Conversation and messages | Chat | Buyer can start conversation and send/read message | backend-api-builder |
| API-012 | API | Own listing conflict | Business rule | User cannot start conversation with own listing | backend-api-builder |
| API-013 | API | Report item | Safety | Verified user can create a report | backend-api-builder |
| API-014 | API | Seller profile and user products | Seller profile | Public profile hides private fields and returns active seller listings | backend-api-builder |
| SOCKET-001 | Socket | Real-time chat send/read | Chat | Verified participants can join, send, receive ack/new-message events, and emit read state | backend-api-builder |
| UI-001 | E2E | Visitor opens home and marketplace | Browse | Home and marketplace render listings from live API | frontend-prototype-designer |
| UI-001A | E2E | School dropdown | Browse | Home exposes a school selector defaulted to UTA | frontend-prototype-designer |
| UI-001B | E2E | Seller profile from listing | Seller profile | Listing seller link opens `/profile/:id` and active listings render | frontend-prototype-designer |
| UI-002 | E2E | Login flow | Auth | User logs in and is redirected to marketplace | frontend-prototype-designer |
| UI-003 | E2E | Create listing with image upload | Seller flow | User fills form, uploads image, creates listing, and sees detail page | frontend-prototype-designer |
| UI-004 | E2E | Listing detail actions | Buyer flow | Non-owner can favorite and start a conversation | frontend-prototype-designer/integration-tester |
| UI-005 | E2E | Chat send message | Chat | Participant sends message and sees it in thread | frontend-prototype-designer |
| UI-006 | E2E | Course search | Course item flow | User searches course and can open course listings | frontend-prototype-designer |
| UI-007 | E2E | Verification flow | Auth | Newly registered user sends code and confirms verification | frontend-prototype-designer |
| UI-008 | E2E | My listings | Seller flow | Current user's created listing appears in My Listings | frontend-prototype-designer/integration-tester |
| UI-009 | E2E | Logged-out page tour | Browse/Auth | Visitor can open public pages; protected pages redirect to login and protected product actions show login/verification prompt | frontend-prototype-designer/integration-tester |
| UI-010 | E2E | New user full seller flow | Seller flow | New user registers, verifies, uploads an image, creates listing, and sees it in My Listings | frontend-prototype-designer/backend-api-builder |
| UI-011 | E2E | Two-user marketplace interaction | Chat | Seeded buyer messages new seller; new seller sees chat and replies | frontend-prototype-designer/backend-api-builder/integration-tester |
| OPS-001 | Data cleanup | Remove automated test data | Test hygiene | Previous and current test products, users, chats, messages, favorites, reports, images rows, and course links are deleted by prefix | prototype-test-runner |

## Automation Artifacts

- API smoke tests: `tests/api-smoke.mjs`
- Socket smoke tests: `tests/socket-smoke.mjs`
- Playwright E2E tests: `tests/e2e/campus-trade.spec.js`
- Full journey cleanup E2E tests: `tests/e2e/full-journey-cleanup.spec.js`
- Database cleanup script: `backend/scripts/cleanup-test-data.mjs`
- API result JSON: `test-results/api-smoke-results.json`
- Playwright JSON report: `playwright-artifacts/playwright-results-<run-id>.json`
- Final test report: `docs/test-report.md`

# Task Handoff

## Purpose

This file is the planner-to-builder handoff. After product planning changes, use this file to assign implementation and verification work to the prototype skills.

## Current Product Change

Design update: mobile marketplace search stays visible under school selection, marketplace hides sold products, seller profiles make available/sold states clearer, favorites toggle on/off, and mobile listing detail prioritizes title, price, actions, tags, description, then seller.

Source docs:

- `docs/product-requirements.md`
- `docs/frontend-spec.md`
- `docs/backend-api.md`
- `docs/database-schema.md`
- `docs/integration-checklist.md`

## Task Batch 2026-05-29 Mobile Marketplace and Detail Refinement

Status: assigned to frontend and integration verification.

### 1. frontend-prototype-designer

Owner: `frontend-prototype-designer`

Tasks:

- Keep mobile marketplace search permanently visible under the school dropdown.
- Keep mobile `Sort` and `Filter` controls side by side.
- Request/display available marketplace listings only; do not show sold products in public feeds.
- Hide `available` badges on cards; show clear sold styling only in seller contexts.
- Make card and detail favorite buttons toggle: first click saves, second click removes.
- Reorder mobile listing detail to title/price, actions, info tags, description, seller.

### 2. integration-tester

Owner: `integration-tester`

Tasks:

- Verify favorite toggles call `POST /api/favorites/:productId` and `DELETE /api/favorites/:productId`.
- Verify marketplace calls `GET /api/products` with `status=available`.
- Verify mobile tests cover visible search, sort/filter controls, and detail favorite state.

## Task Batch 2026-05-29

Status: first implementation pass completed for backend, frontend, integration checks, and smoke coverage.

### 1. frontend-prototype-designer

Owner: `frontend-prototype-designer`

Goal: update the React + Tailwind prototype to match the new marketplace and chat UX.

Tasks:

- Replace the current homepage with a simple marketplace-first page.
- Add a school dropdown to the marketplace/home filter area.
- Persist selected school for visitors and default signed-in users to their verified school.
- Update listing creation UI to show school context. For normal verified students, lock school to the user's school.
- Update chat detail UI to show the other user's avatar/name, buyer/seller role, verified status, and profile link.
- Add real-time chat client structure, preferably `SocketProvider`, with REST fallback for initial history.
- Update conversation list rows to show unread counts, other user identity, listing status, and last message time.
- Build or finish `/profile/:id` as a seller profile page with profile header and active listings.
- Ensure listing detail seller name/avatar links to `/profile/:id`.

Inputs:

- `docs/frontend-spec.md`
- `docs/backend-api.md`
- Current `frontend/src` implementation

Acceptance:

- Done: logged-out visitors can browse marketplace and seller profiles.
- Done: verified users can create listings with visible school context locked to their verified school.
- Done: chat detail identifies the other participant and links to `/profile/:id`.
- Done: frontend has Socket.io chat send/read paths with REST fallback for initial history and failed socket send.
- Done: existing E2E browse, auth, create listing, profile, and chat flows pass.

### 2. backend-api-builder

Owner: `backend-api-builder`

Goal: implement backend support for real-time messaging and seller profiles.

Tasks:

- Add Socket.io or WebSocket server using the same JWT auth.
- Reject socket join/send for unauthenticated or unverified users.
- Implement `conversation:join`, `message:send`, and `message:read` events.
- Persist each socket message before broadcasting.
- Emit `message:ack`, `message:new`, `conversation:updated`, `message:read`, and `message:error`.
- Add `GET /api/conversations/:id`.
- Enrich `GET /api/conversations/:id/messages` with `sender`.
- Support optional message pagination params.
- Ensure `PATCH /api/conversations/:id/read` can mark incoming messages as read.
- Add `GET /api/users/:id/profile`.
- Add `GET /api/users/:id/products`, or document that frontend should use `GET /api/products?sellerId=...`.
- Ensure product creation ignores disallowed `schoolId` and assigns the verified user's school.

Inputs:

- `docs/backend-api.md`
- `docs/database-schema.md`
- Current `backend/src` implementation

Acceptance:

- Done: REST conversation list still works.
- Done: real-time messages persist and appear in REST history.
- Done: read events and unread-count source fields are implemented.
- Done: seller profile endpoints expose no email, password hash, or private verification data.
- Done: API smoke tests pass with profile coverage; socket smoke tests pass.

### 3. integration-tester

Owner: `integration-tester`

Goal: verify that the frontend, backend, docs, and database agree after the new work.

Tasks:

- Compare frontend socket event names and payloads against backend handlers.
- Compare REST profile APIs against frontend profile page needs.
- Verify chat detail uses `otherUser` fields consistently.
- Verify unread count and `readAt` behavior across REST and socket flows.
- Verify school dropdown maps to `schoolId` filters on browse pages.
- Verify product creation school ownership cannot be spoofed from the client.
- Update `docs/integration-checklist.md` with fixed items and remaining mismatches.

Inputs:

- `docs/integration-checklist.md`
- `docs/frontend-spec.md`
- `docs/backend-api.md`
- Frontend API/socket client code
- Backend routes/socket handlers

Acceptance:

- Done for implemented scope: REST route names, socket event names, profile fields, chat `otherUser`, and school ownership behavior are aligned.
- Remaining gaps are documented in `docs/integration-checklist.md`.

### 4. prototype-test-runner

Owner: `prototype-test-runner`

Goal: add automated coverage for the new behavior.

Tasks:

- Add API tests for seller profile and user products.
- Add socket tests for connect, join, send, receive, ack, and read events.
- Add E2E tests for:
  - marketplace school dropdown
  - simple homepage marketplace rendering
  - seller profile opens from listing detail
  - profile active listings render
  - two-user real-time chat updates without manual refresh
  - unread count clears after opening a thread
- Keep cleanup coverage for test-created users, products, conversations, and messages.

Inputs:

- `docs/test-plan.md`
- `docs/backend-api.md`
- `docs/frontend-spec.md`
- Existing `tests/` setup

Acceptance:

- Done: API/profile tests pass.
- Done: Socket tests pass.
- Done: E2E tests pass in Chromium.
- Done: Test data cleanup returns zero matching rows after test completion.

## Suggested Execution Order

1. Done: `backend-api-builder`: socket/profile backend and school ownership guard.
2. Done: `frontend-prototype-designer`: marketplace home, school dropdown, profile page, socket client UI.
3. Done: `integration-tester`: contract pass and mismatch fixes for implemented scope.
4. Done: `prototype-test-runner`: API, socket, and E2E coverage.

Frontend can start mock-first on profile and socket UI while backend work is underway, but final integration should wait for backend event names and payloads.

## Task Batch 2026-05-30

### Chat Detail Refinement

Source: user annotated current `/chats/:id` screen.

#### frontend-prototype-designer

Owner: `frontend-prototype-designer`

Goal: refine the chat detail layout so product context, participant identity, live state, message scroll, and composer placement match the requested interaction.

Tasks:

- Make the compact product summary at the top clickable to `/listings/:productId`.
- Keep product summary separate from the chat participant row.
- Move participant identity into its own row under the product summary.
- Show participant avatar/initial, name, verified badge, school, and profile link in that row.
- Move `Live`/fallback state next to the participant identity rather than the product status area.
- Keep listing `available/pending/sold` status near the product summary.
- Make the message list scroll independently.
- Pin the message composer to the bottom of the chat panel.

Acceptance:

- Done: product title/image in chat detail opens the product detail page.
- Done: participant name/avatar area opens `/profile/:id`.
- Done: Live/fallback state appears in the participant row.
- Done: composer remains at the bottom of the chat panel while messages scroll.
- Done: existing chat E2E passes.

#### integration-tester

Owner: `integration-tester`

Tasks:

- Verify product link uses `conversation.product.id`.
- Verify profile link uses `conversation.otherUser.id`.
- Verify chat still sends through Socket.io or REST fallback.
- Update integration checklist if the implemented behavior differs from docs.

Status:

- Done: product link uses `conversation.product.id`.
- Done: profile link uses `conversation.otherUser.id`.
- Done: existing chat send flow still passes.

#### prototype-test-runner

Owner: `prototype-test-runner`

Tasks:

- Add or update E2E assertions for product link, profile link, and visible fixed composer.
- Keep existing cleanup behavior unchanged.

Status:

- Done: E2E assertions added for product link, profile link, and composer visibility.
- Done: cleanup script removed test-created rows after the run.

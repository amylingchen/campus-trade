# Campus Trade Frontend Spec

## Stack Target

- React
- Tailwind CSS
- React Router or framework-native routing
- Mock data first
- Placeholder API client functions matching `docs/backend-api.md`

If the existing project uses Next.js, TypeScript, or a different React structure, follow the existing project conventions while preserving the routes and contract below.

## Route Map

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Marketplace Home | Simple marketplace-first listing feed with school dropdown, search, categories, and quick filters. |
| `/auth/login` | Login | Email/password login. |
| `/auth/register` | Register | Create account and choose school. |
| `/verify-school` | School Verification | Send and confirm school email verification code. |
| `/marketplace` | Marketplace | Browse, search, filter, and sort listings. |
| `/listings/new` | New Listing | Create a listing. Requires verified user. |
| `/listings/:id` | Listing Detail | View listing, favorite, report, and message seller. |
| `/listings/:id/edit` | Edit Listing | Owner edits listing details. |
| `/courses` | Course Search | Search listings by course code. |
| `/courses/:courseCode` | Course Listings | Show listings tagged with one course. |
| `/chats` | Conversation List | Show buyer/seller conversations. |
| `/chats/:id` | Chat Detail | Show messages and send text message. |
| `/me` | Account | Profile, verification status, quick links. |
| `/me/listings` | My Listings | Manage active, pending, and sold listings. |
| `/me/favorites` | Favorites | Saved listings. |
| `/profile/:id` | Public Profile | Seller profile and active listings. |

Route protection:

- Public: `/`, `/auth/login`, `/auth/register`, `/marketplace`, `/listings/:id`, `/courses`, `/courses/:courseCode`, `/profile/:id`.
- Authenticated: `/verify-school`, `/me`.
- Authenticated and verified: `/listings/new`, `/listings/:id/edit`, `/chats`, `/chats/:id`, `/me/listings`, `/me/favorites`.
- Protected routes use stored token plus stored user as the frontend session source. Mock users must not unlock authenticated pages.

## Navigation

Desktop primary navigation:

- Marketplace
- Course Items
- Sell
- Chats
- My Account

Mobile bottom navigation:

- Home
- Search
- Sell
- Chats
- Me

## Page Responsibilities

### Marketplace Home

- Keep the first screen simple and marketplace-first, closer to Facebook Marketplace or Xianyu than a marketing landing page.
- Show school dropdown in the top/filter area. Default to UTA or the signed-in user's school.
- Show search, category shortcuts, and a listing grid immediately.
- Show coming soon schools as disabled dropdown choices or clearly unavailable options.
- Avoid large hero sections, value-prop panels, and commercial landing-page copy.
- Persist selected school locally for visitors; signed-in users default back to their verified school when posting.

### Marketplace

- Search by keyword.
- Filter by category, condition, status, usage type, price range, and course code.
- Sort by latest, lowest price, highest price.
- Render listing cards.
- Show empty state when no results match.
- On mobile, keep the search field permanently visible directly under the school selector. Place `Sort` and `Filter` as side-by-side controls below search.
- Marketplace listing results must hide `sold` and `removed` products by default. Do not expose `sold` as a marketplace filter.
- Product cards should not show an `available` badge. Use a clear badge and gray image/text treatment for `sold` products when sold items are shown in seller contexts.
- On mobile, listing cards should use a denser two-column layout with smaller image, title, price, and location treatment similar to marketplace apps.

### Listing Detail

- Show image gallery.
- On mobile, show title and price first, then message/save/report actions, then tag-style listing facts, then description, then seller info.
- Show title, price, status when not `available`, negotiable flag, category, condition, usage type, location, description, course codes, and seller info.
- Show primary actions based on auth and ownership:
  - visitor: prompt login/verification to message
  - verified buyer: Message Seller
  - owner: Edit, Mark Pending, Mark Sold, Delete
  - sold listing: Sold state, no primary message CTA for non-participants
- Include Favorite and Report actions where allowed.
- Seller name/avatar links to `/profile/:id`.

### New / Edit Listing

- Fields: school, title, price, images, category, usage type, condition, description, pickup location, negotiable, isCourseRelated, courseCodes.
- School defaults to the verified user's school. For MVP student accounts, the selector is locked/read-only. If a future account can post in multiple schools, the selector becomes editable with allowed schools only.
- Use client-side validation that mirrors backend validation.
- Show preview-friendly form states.

### Chats

- Conversation list sorted by `lastMessageAt`.
- Uses REST for initial load and pagination.
- Each row shows listing title, other participant name/avatar, last message preview, unread count, listing status, and last message time.
- Rows update from real-time socket events when the user is online.

### Chat Detail

- Show a compact product summary at the top. Product image/title/price should link to `/listings/:id`; listing status may stay on the right.
- Product summary and chat participant identity must be visually separated.
- Show chat object in a second header row: other participant avatar/initial, name, seller/buyer role when available, verification state, school, and link to `/profile/:id`.
- Place the `Live` connection indicator next to the chat participant identity, not as a detached product status control.
- Show buyer/seller messages in real time.
- Send message form emits through the socket; REST history remains the refresh/bootstrap fallback.
- Mark incoming messages read when the thread is opened and when the user is actively viewing the thread.
- Show message delivery/persisted state minimally: sending, sent, failed retry.
- Show sold/pending banner based on listing status.
- Keep the composer fixed at the bottom of the chat panel while the message list scrolls independently.

### Public Profile

- Layout should feel like a marketplace seller profile, not a social feed.
- Header shows avatar, display name, school, verified badge, optional major/bio, joined date, and lightweight seller stats such as active listing count.
- Main content shows active listings as cards filtered by `sellerId` and selected school.
- Include tabs or sections for active listings and sold listings only if data exists.
- Profile can be opened from listing detail seller info, chat header, and conversation list participant identity.

### Account

- Show user name, school, school verification status, and optional major.
- Seller profiles may show both active and sold sections. `Available` and `Sold` section labels should be visually obvious; sold cards should use gray image overlays and muted title/detail text.
- Link to My Listings, Favorites, and Logout.

## Component List

- `AppShell`
- `TopNav`
- `MobileNav`
- `SchoolSelector`
- `SearchBar`
- `FilterPanel`
- `ListingCard`
- `ListingGrid`
- `ListingStatusBadge`
- `CourseTag`
- `SellerSummary`
- `ImageGallery`
- `ListingForm`
- `FavoriteButton`
- `ReportDialog`
- `ConversationListItem`
- `MessageBubble`
- `ChatComposer`
- `SocketProvider`
- `SellerProfileHeader`
- `SellerListingsGrid`
- `AuthGuard`
- `VerificationGate`
- `EmptyState`
- `LoadingState`
- `ErrorState`

## Mock Data Objects

Mock data must use API-shaped camelCase fields:

- `school`
- `user`
- `listing`
- `listingImage`
- `course`
- `favorite`
- `conversation`
- `message`
- `messageReceipt`
- `report`

Example listing:

```json
{
  "id": "listing_1",
  "schoolId": "school_uta",
  "sellerId": "user_1",
  "title": "Raspberry Pi 4 Kit",
  "description": "Includes Pi 4, case, charger, SD card, and sensors.",
  "price": 45,
  "category": "course_materials",
  "usageType": "course_required",
  "condition": "good",
  "status": "available",
  "location": "Central Library",
  "negotiable": true,
  "isCourseRelated": true,
  "courseCodes": ["CSE 3442"],
  "images": [
    {
      "id": "image_1",
      "imageUrl": "https://images.unsplash.com/photo-placeholder",
      "sortOrder": 1
    }
  ],
  "seller": {
    "id": "user_1",
    "name": "Alex Chen",
    "schoolShortName": "UTA",
    "verifiedStudent": true
  },
  "createdAt": "2026-05-29T18:00:00.000Z",
  "updatedAt": "2026-05-29T18:00:00.000Z"
}
```

## API Client Placeholders

Create placeholder functions matching these backend routes:

- `listSchools()`
- `getCurrentUser()`
- `loginUser(payload)`
- `registerUser(payload)`
- `sendVerificationCode(payload)`
- `confirmVerificationCode(payload)`
- `listProducts(params)`
- `getProduct(id)`
- `createProduct(payload)`
- `updateProduct(id, payload)`
- `deleteProduct(id)`
- `setProductStatus(id, status)`
- `uploadProductImage(file)`
- `listFavorites()`
- `addFavorite(productId)`
- `removeFavorite(productId)`
- `listCourses(params)`
- `listCourseProducts(courseCode, params)`
- `listConversations()`
- `getConversation(id)`
- `startConversation(productId)`
- `listMessages(conversationId)`
- `sendMessage(conversationId, payload)` as REST fallback only; primary chat send uses socket event `message:send`.
- `markConversationRead(conversationId)`
- `getUserProfile(userId)`
- `listUserProducts(userId, params)` or `listProducts({ sellerId })`
- `createReport(payload)`

## Real-Time Messaging Client Contract

Transport:

- Use Socket.io or WebSocket with JWT authentication.
- Connect only after login and only for verified users.
- REST APIs still load the conversation list and initial message history.

Client events:

- `conversation:join` with `{ conversationId }`
- `message:send` with `{ conversationId, clientMessageId, content }`
- `message:read` with `{ conversationId, messageIds }` or `{ conversationId, readUntilMessageId }`

Server events:

- `message:new` returns a persisted message object with sender info and timestamps.
- `message:ack` maps `clientMessageId` to the persisted message id.
- `message:error` returns the failed `clientMessageId` and error.
- `conversation:updated` updates conversation list preview, unread count, and timestamp.
- `message:read` updates read state for participant messages.

## UI States

- Loading: skeleton cards or compact loaders.
- Empty: helpful message and next action, such as clearing filters or creating a listing.
- Error: concise message and retry action.
- Unauthorized: login prompt.
- Unverified: school email verification prompt.
- Owner-only actions: hidden from non-owners.
- Auth-gated pages: redirect unauthenticated visitors to `/auth/login`; show a verification prompt for authenticated but unverified users.

## Frontend Acceptance Criteria

- Pages can be clicked through with mock data before backend is available.
- Mock fields match `docs/backend-api.md`.
- API client functions point to documented paths.
- Marketplace and listing detail work on desktop and mobile.
- Chat screens display realistic buyer/seller conversations.
- Form validation matches the main backend required fields.
- Listing forms use file upload with preview for photos, not manual image URL entry.

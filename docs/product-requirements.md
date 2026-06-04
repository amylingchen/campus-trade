# Campus Trade MVP Product Requirements

## Product Goal

Build a multi-school campus second-hand marketplace where verified students can buy and sell course-related items and everyday goods inside their school community. The first supported community is University of Texas at Arlington (UTA), with the system designed so additional schools can be added later.

## Problem

Students often need special tools, books, electronics, or supplies for specific courses, such as Raspberry Pi kits, Arduino boards, lab tools, calculators, or textbooks. After a course ends, those items often become unused even though the next group of students needs them. Students also need a trusted local place to buy and sell dorm, moving, and daily-use items.

## Target Users

- Student buyer: browses listings, searches by category or course, saves items, and chats with sellers.
- Student seller: posts listings, manages active/sold status, and responds to buyers.
- School community member: uses a verified school email to access trusted trading features.
- Admin, later: reviews reports and removes unsafe or disallowed listings.

## MVP Scope

### In Scope

- School community selection with UTA as the first active school.
- User registration and login.
- School email verification before posting, favoriting, or chatting.
- Marketplace listing browse/search/filter.
- Product detail page.
- Create, edit, delete, and mark listing as pending or sold.
- Course-related listing support using free-form course codes such as `CSE 3442`.
- Favorites.
- Buyer-seller conversations tied to a product.
- Real-time buyer-seller messaging inside each conversation, with REST APIs kept for conversation list, history bootstrap, and read-state recovery.
- Conversation list unread counts and message read status.
- Seller public profile pages showing seller identity, school verification, bio/major when available, active listings, and sold-count style marketplace context.
- Basic reports for listings/users.
- Simple marketplace-first home page with school dropdown switching.
- Responsive frontend prototype with mock data first.
- Node.js, Express, and MySQL backend API.

### Out of Scope for MVP

- Payment processing.
- Delivery or shipping.
- Ratings and reviews.
- Push notifications.
- Full admin dashboard.
- Complete official course catalog import.
- Cross-school trading.
- Push notifications outside the open browser tab.

## Assumptions

- Any visitor may browse listings.
- Only authenticated and school-verified users may create listings, favorite listings, start conversations, send messages, or submit reports.
- Favorites are toggle actions: first click saves a listing, second click removes it. Product cards and product detail must reflect the current saved state.
- Public marketplace feeds hide sold and removed products. Seller profile contexts can show sold products, but sold items must be clearly marked and visually muted.
- A user belongs to one school for MVP.
- Listings are browsed by selected school community. Posting uses the verified user's school by default; future admin/multi-school accounts may choose from eligible schools.
- A visitor can switch the marketplace school from a dropdown. UTA remains the first active seed school.
- Transactions happen offline at public campus locations.
- The platform does not hold money or guarantee payment.
- JSON API fields use camelCase. MySQL columns use snake_case.

## Schools

MVP seed school:

- `shortName`: UTA
- `name`: University of Texas at Arlington
- `emailDomain`: mavs.uta.edu
- `city`: Arlington
- `state`: TX

Future schools can be added as active or coming soon communities.

## Core User Flows

### Buyer Flow

1. User lands on a simple marketplace page and selects a school from a dropdown, defaulting to UTA.
2. User browses or searches listings.
3. User filters by category, price, condition, status, or course code.
4. On mobile, the school selector remains first, followed by a persistent search field and compact sort/filter controls.
4. User opens a listing detail page.
5. User opens the seller profile to inspect the seller's active listings and school verification context.
6. User logs in and verifies school email if needed.
7. User starts a conversation with the seller.
8. Buyer and seller exchange real-time messages and agree on item details, time, and public campus meeting location.

### Seller Flow

1. User registers or logs in.
2. User verifies school email.
3. User opens Sell page.
4. User enters title, price, category, condition, description, pickup location, images, optional course code, and school. For normal student accounts, school defaults to and is locked to the verified user's school.
5. Listing is published as available under the selected/verified school.
6. Seller receives conversations from buyers.
7. Seller sees unread chat states and read receipts for opened conversations.
8. Seller marks item pending or sold after arranging a trade.

### Real-Time Messaging Flow

1. Buyer starts or opens a conversation from a product.
2. Chat detail loads conversation metadata and initial message history by REST.
3. Frontend opens an authenticated WebSocket connection.
4. Sending a message emits a socket event and persists the message server-side.
5. Both participants receive the message in real time when online.
6. When a participant opens the thread, the client marks messages from the other participant as read.
7. Conversation list continues to use REST for initial load and unread counts, then may update live from socket events.

### Course Item Flow

1. User searches a course code, for example `CSE 3442`.
2. Marketplace shows course-related listings tagged with that course code.
3. User can combine course code with category and price filters.

### Reporting Flow

1. Verified user opens a listing or seller profile.
2. User submits a report with reason and optional details.
3. Report is stored for later admin review.

### Seller Profile Flow

1. User opens a seller name/avatar from listing detail, chat header, or listing card.
2. Profile page shows seller display info, verification status, school, optional bio/major, joined date, and response-friendly marketplace context.
3. Page shows seller's active listings first, with sold listings optionally shown in a separate section later.
4. Buyer can open any listing from the seller profile and start product-specific chat from the listing detail.

## Business Rules

- A user cannot start a conversation for their own listing.
- A buyer and seller can have only one conversation per listing.
- Listings can be `available`, `pending`, `sold`, or `removed`.
- Sold listings remain visible to the seller and conversation participants but should not show a primary "Message Seller" call to action in public listing detail.
- Listing `schoolId` and `sellerId` are assigned by the server from the authenticated user.
- Only a listing owner can edit, delete, or change listing status.
- Only conversation participants can read or send messages.
- Message sends are persisted before broadcast. Socket delivery is best-effort; REST history remains the source of truth after refresh.
- A message is unread for the recipient until they open the conversation or explicitly mark it read.
- Conversation list unread counts count messages sent by the other participant with `readAt = null`.
- Course codes are normalized to uppercase with spaces removed or standardized, for example `CSE3442` or display format `CSE 3442`.
- Public seller profiles show only non-sensitive user fields and public listings.
- Normal student sellers cannot post into a school different from their verified school. If the UI shows a school selector on Sell, it should be disabled or prefilled unless the account is eligible for multiple schools.

## Listing Categories

- `course_materials`: Course Materials
- `electronics`: Electronics
- `books`: Books
- `furniture`: Furniture
- `dorm_home`: Dorm & Home
- `clothing`: Clothing
- `transportation`: Transportation
- `sports_outdoor`: Sports & Outdoor
- `tickets_events`: Tickets & Events
- `free_stuff`: Free Stuff
- `other`: Other

## Usage Types

- `course_required`
- `course_recommended`
- `personal_sale`
- `moving_sale`
- `free`

## Conditions

- `new`
- `like_new`
- `good`
- `fair`
- `poor`

## MVP Acceptance Criteria

- A visitor can select UTA and browse marketplace listings.
- A visitor can search and filter listings.
- A verified student can create a listing with optional course code.
- A listing detail page shows images, price, category, condition, location, seller, and course tags.
- A seller profile page shows seller info and active listings.
- A verified buyer can start a product conversation with a seller.
- Buyer and seller can exchange real-time text messages while online.
- Conversation list shows unread counts and opened threads mark incoming messages as read.
- A seller can manage their listings and mark an item sold.
- Home page is a simple marketplace surface with school dropdown and listing feed, not a marketing-style landing page.
- Product creation assigns the listing to the verified user's school by default.
- Frontend mock data uses the same field names as the backend API contract.
- Backend implements the documented routes and returns documented response shapes.
- Integration checklist confirms matching routes, fields, CORS, and auth assumptions.

## Later Enhancements

- School admin approval tools.
- Email or push notifications.
- User ratings and trade history.
- Saved searches and course demand alerts.
- Image moderation.
- Payment or escrow, only after legal and policy review.

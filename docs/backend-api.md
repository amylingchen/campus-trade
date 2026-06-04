# Campus Trade Backend API

## Base URL

Development base URL:

```text
http://localhost:4000/api
```

Development real-time URL:

```text
ws://localhost:4000
```

Frontend development origin:

```text
http://localhost:5173
```

If a framework uses a different frontend port, update CORS and `docs/integration-checklist.md`.

## Auth Assumptions

- MVP uses email/password auth.
- The backend returns a token on login and register.
- Frontend sends `Authorization: Bearer <token>` for authenticated routes.
- Public routes may be read without a token.
- Verified-student-only routes require `verifiedStudent = true`.
- Real-time messaging uses the same JWT. The frontend passes it during Socket.io/WebSocket connection, and the backend resolves the current user from that token.

## Common Response Shapes

Success with one object:

```json
{
  "data": {}
}
```

Success with list:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required.",
    "details": []
  }
}
```

## Status Codes

- `200`: successful read or update
- `201`: created
- `204`: deleted
- `400`: validation error
- `401`: unauthenticated
- `403`: unauthorized or not school verified
- `404`: missing resource
- `409`: uniqueness or state conflict
- `500`: unexpected server error

## Schools

### GET `/schools`

Public. Returns active and coming-soon schools.

Response:

```json
{
  "data": [
    {
      "id": "school_uta",
      "name": "University of Texas at Arlington",
      "shortName": "UTA",
      "emailDomain": "mavs.uta.edu",
      "city": "Arlington",
      "state": "TX",
      "logoUrl": null,
      "isActive": true
    }
  ]
}
```

### GET `/schools/:id`

Public. Returns one school.

## Auth

### POST `/auth/register`

Body:

```json
{
  "name": "Alex Chen",
  "email": "alex@mavs.uta.edu",
  "password": "password123",
  "schoolId": "school_uta"
}
```

Response `201`:

```json
{
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user_1",
      "schoolId": "school_uta",
      "name": "Alex Chen",
      "email": "alex@mavs.uta.edu",
      "major": null,
      "avatarUrl": null,
      "verifiedStudent": false,
      "verificationStatus": "pending"
    }
  }
}
```

### POST `/auth/login`

Body:

```json
{
  "email": "alex@mavs.uta.edu",
  "password": "password123"
}
```

Response `200`: same shape as register.

### GET `/auth/me`

Authenticated. Returns current user.

### POST `/auth/logout`

Authenticated. Stateless MVP may return `204`.

## School Verification

### POST `/verification/send-code`

Authenticated.

Body:

```json
{
  "email": "alex@mavs.uta.edu"
}
```

Rules:

- Email domain must match the user's school `emailDomain`.
- Create a short-lived code.

Response:

```json
{
  "data": {
    "sent": true,
    "expiresAt": "2026-05-29T19:00:00.000Z",
    "devCode": "123456"
  }
}
```

`devCode` is returned only for local non-production development so the verification flow can be tested without email delivery.

### POST `/verification/confirm-code`

Authenticated.

Body:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "data": {
    "verifiedStudent": true,
    "verificationStatus": "verified"
  }
}
```

## Products

### GET `/products`

Public.

Query params:

- `schoolId`
- `sellerId`
- `q`
- `category`
- `usageType`
- `condition`
- `status`
- `courseCode`
- `minPrice`
- `maxPrice`
- `sort`: `latest`, `price_asc`, `price_desc`
- `page`
- `pageSize`

Response:

```json
{
  "data": [
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
      "imageUrl": "https://images.unsplash.com/photo-placeholder",
      "seller": {
        "id": "user_1",
        "name": "Alex Chen",
        "schoolShortName": "UTA",
        "verifiedStudent": true
      },
      "createdAt": "2026-05-29T18:00:00.000Z",
      "updatedAt": "2026-05-29T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### POST `/products`

Authenticated and verified.

Body:

```json
{
  "schoolId": "school_uta",
  "title": "Raspberry Pi 4 Kit",
  "description": "Includes Pi 4, case, charger, SD card, and sensors.",
  "price": 45,
  "category": "course_materials",
  "usageType": "course_required",
  "condition": "good",
  "location": "Central Library",
  "negotiable": true,
  "isCourseRelated": true,
  "courseCodes": ["CSE 3442"],
  "images": [
    {
      "imageUrl": "https://images.unsplash.com/photo-placeholder",
      "sortOrder": 1
    }
  ]
}
```

Response `201`:

```json
{
  "data": {
    "id": "listing_1"
  }
}
```

Required fields:

- `title`
- `description`
- `price`
- `category`
- `condition`
- `location`

Rules:

- For normal student accounts, `schoolId` is optional and ignored if it differs from the verified user's `schoolId`; the server assigns the product to the user's school.
- If the UI includes a school selector, it should send `schoolId` only for future multi-school-capable accounts.

### GET `/products/:id`

Public. Returns full listing with all images, course codes, seller info, and `isFavorited` when authenticated.

### PATCH `/products/:id`

Authenticated owner only. Accepts the same editable fields as create.

### PATCH `/products/:id/status`

Authenticated owner only.

Body:

```json
{
  "status": "sold"
}
```

Allowed status values:

- `available`
- `pending`
- `sold`
- `removed`

### DELETE `/products/:id`

Authenticated owner only. Returns `204`.

## Uploads

### POST `/uploads`

Authenticated and verified. Accepts `multipart/form-data`.

Form fields:

- `image`: required file field. Allowed types are JPG, PNG, WebP, and GIF. Max size is 5MB.

Response `201`:

```json
{
  "data": {
    "imageUrl": "/uploads/product-1780000000000-123456789.png",
    "filename": "product-1780000000000-123456789.png",
    "mimeType": "image/png",
    "size": 1024
  }
}
```

Use returned `imageUrl` inside product create/update payloads:

```json
{
  "images": [
    {
      "imageUrl": "/uploads/product-1780000000000-123456789.png",
      "sortOrder": 1
    }
  ]
}
```

## Favorites

### GET `/favorites`

Authenticated and verified. Returns favorited products.

### POST `/favorites/:productId`

Authenticated and verified. Adds favorite. Returns `201`.

### DELETE `/favorites/:productId`

Authenticated and verified. Removes favorite. Returns `204`.

## Courses

### GET `/courses`

Public.

Query params:

- `schoolId`
- `q`

Response:

```json
{
  "data": [
    {
      "id": "course_1",
      "schoolId": "school_uta",
      "courseCode": "CSE 3442",
      "courseName": "Embedded Systems",
      "department": "CSE"
    }
  ]
}
```

### GET `/courses/:courseCode/products`

Public. Same query and response shape as `GET /products`, filtered by course code.

## Conversations

### GET `/conversations`

Authenticated and verified. Returns conversations for current user.

Response:

```json
{
  "data": [
    {
      "id": "conversation_1",
      "productId": "listing_1",
      "buyerId": "user_2",
      "sellerId": "user_1",
      "lastMessageAt": "2026-05-29T18:30:00.000Z",
      "unreadCount": 1,
      "product": {
        "id": "listing_1",
        "title": "Raspberry Pi 4 Kit",
        "price": 45,
        "status": "available",
        "imageUrl": "https://images.unsplash.com/photo-placeholder"
      },
      "otherUser": {
        "id": "user_2",
        "name": "Maya Patel",
        "avatarUrl": null,
        "schoolShortName": "UTA",
        "verifiedStudent": true
      },
      "lastMessage": {
        "id": "message_1",
        "content": "Can we meet at the library tomorrow?",
        "createdAt": "2026-05-29T18:30:00.000Z"
      }
    }
  ]
}
```

`unreadCount` counts messages from the other participant with `readAt = null`.

### GET `/conversations/:id`

Authenticated participant only. Returns conversation metadata for chat headers and real-time setup.

Response:

```json
{
  "data": {
    "id": "conversation_1",
    "productId": "listing_1",
    "buyerId": "user_2",
    "sellerId": "user_1",
    "lastMessageAt": "2026-05-29T18:30:00.000Z",
    "product": {
      "id": "listing_1",
      "title": "Raspberry Pi 4 Kit",
      "price": 45,
      "status": "available",
      "imageUrl": "https://images.unsplash.com/photo-placeholder"
    },
    "otherUser": {
      "id": "user_1",
      "name": "Alex Chen",
      "avatarUrl": null,
      "schoolShortName": "UTA",
      "verifiedStudent": true
    }
  }
}
```

### POST `/conversations`

Authenticated and verified.

Body:

```json
{
  "productId": "listing_1"
}
```

Rules:

- Current user becomes buyer.
- Product seller becomes seller.
- User cannot start a conversation with their own product.
- Existing conversation for same buyer, seller, and product is returned instead of duplicated.

Response `201` or `200`:

```json
{
  "data": {
    "id": "conversation_1"
  }
}
```

### GET `/conversations/:id/messages`

Authenticated participant only. Returns messages.

Query params:

- `beforeMessageId`
- `afterMessageId`
- `pageSize`

Response:

```json
{
  "data": [
    {
      "id": "message_1",
      "conversationId": "conversation_1",
      "senderId": "user_2",
      "content": "Is this still available?",
      "readAt": null,
      "createdAt": "2026-05-29T18:30:00.000Z",
      "sender": {
        "id": "user_2",
        "name": "Maya Patel",
        "avatarUrl": null
      }
    }
  ]
}
```

### POST `/conversations/:id/messages`

Authenticated participant only. REST fallback for tests, non-socket clients, and retry recovery. Primary chat sending should use the real-time event.

Body:

```json
{
  "content": "Is this still available?"
}
```

Response `201`:

```json
{
  "data": {
    "id": "message_1",
    "conversationId": "conversation_1",
    "senderId": "user_2",
    "content": "Is this still available?",
    "readAt": null,
    "createdAt": "2026-05-29T18:30:00.000Z",
    "sender": {
      "id": "user_2",
      "name": "Maya Patel",
      "avatarUrl": null
    }
  }
}
```

### PATCH `/conversations/:id/read`

Authenticated participant only. Marks messages from the other participant as read.

Body optional:

```json
{
  "readUntilMessageId": "message_9"
}
```

If body is omitted, mark all currently unread messages from the other participant as read.

## Real-Time Messaging

### Connection

Preferred prototype transport: Socket.io.

Client connects to:

```text
ws://localhost:4000
```

Auth payload:

```json
{
  "token": "jwt-token"
}
```

Rules:

- Token is required.
- User must be verified to join or send in conversations.
- User can join only conversations where they are buyer or seller.
- Server persists each message before broadcasting it.
- REST message history remains the source of truth after reconnect.

### Client Event `conversation:join`

Payload:

```json
{
  "conversationId": "conversation_1"
}
```

### Client Event `message:send`

Payload:

```json
{
  "conversationId": "conversation_1",
  "clientMessageId": "client_1780000000",
  "content": "Can we meet at ERB?"
}
```

Server emits to sender:

```json
{
  "event": "message:ack",
  "data": {
    "clientMessageId": "client_1780000000",
    "message": {
      "id": "message_1",
      "conversationId": "conversation_1",
      "senderId": "user_2",
      "content": "Can we meet at ERB?",
      "readAt": null,
      "createdAt": "2026-05-29T18:30:00.000Z",
      "sender": {
        "id": "user_2",
        "name": "Maya Patel",
        "avatarUrl": null
      }
    }
  }
}
```

Server emits to participants:

```json
{
  "event": "message:new",
  "data": {
    "conversationId": "conversation_1",
    "message": {}
  }
}
```

Server emits conversation-list updates:

```json
{
  "event": "conversation:updated",
  "data": {
    "id": "conversation_1",
    "lastMessageAt": "2026-05-29T18:30:00.000Z",
    "unreadCount": 1,
    "lastMessage": {
      "id": "message_1",
      "content": "Can we meet at ERB?",
      "createdAt": "2026-05-29T18:30:00.000Z"
    }
  }
}
```

### Client Event `message:read`

Payload:

```json
{
  "conversationId": "conversation_1",
  "readUntilMessageId": "message_1"
}
```

Server emits:

```json
{
  "event": "message:read",
  "data": {
    "conversationId": "conversation_1",
    "readerId": "user_1",
    "readUntilMessageId": "message_1",
    "readAt": "2026-05-29T18:31:00.000Z"
  }
}
```

## User Profiles

### GET `/users/:id/profile`

Public. Returns safe seller profile fields.

Response:

```json
{
  "data": {
    "id": "user_1",
    "schoolId": "school_uta",
    "name": "Alex Chen",
    "avatarUrl": null,
    "major": "Computer Science",
    "bio": "Selling course tools after each semester.",
    "verifiedStudent": true,
    "schoolShortName": "UTA",
    "joinedAt": "2026-05-29T18:00:00.000Z",
    "stats": {
      "activeListingCount": 4,
      "soldListingCount": 2
    }
  }
}
```

### GET `/users/:id/products`

Public. Returns the user's public listings.

Query params:

- `schoolId`
- `status`: defaults to `available,pending`
- `page`
- `pageSize`

Response: same list shape as `GET /products`.

## Reports

### POST `/reports`

Authenticated and verified.

Body:

```json
{
  "productId": "listing_1",
  "reportedUserId": "user_1",
  "reason": "prohibited_item",
  "detail": "This listing appears unsafe."
}
```

Response `201`:

```json
{
  "data": {
    "id": "report_1",
    "status": "open"
  }
}
```

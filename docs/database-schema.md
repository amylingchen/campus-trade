# Campus Trade Database Schema

## Conventions

- Database: MySQL.
- Table and column names use snake_case.
- API JSON fields use camelCase.
- IDs may use UUID strings or MySQL `CHAR(36)`.
- Timestamps use `created_at` and `updated_at`.
- Store money as decimal: `DECIMAL(10,2)`.

## Entity Relationship Summary

- One school has many users, products, and courses.
- One user has many products as seller.
- One product has many product images.
- One product can have many courses through `product_courses`.
- One user can favorite many products through `favorites`.
- One product can have many conversations.
- One conversation belongs to one product, one buyer, and one seller.
- One conversation has many messages.
- One message can have per-user read receipts through `message_reads` when the app needs participant-specific read state beyond a single recipient.
- One report belongs to a reporter and may target a product, user, or both.

## Tables

### schools

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| name | VARCHAR(160) | not null |
| short_name | VARCHAR(32) | not null, unique |
| email_domain | VARCHAR(120) | not null |
| city | VARCHAR(80) | not null |
| state | VARCHAR(40) | not null |
| logo_url | VARCHAR(500) | nullable |
| is_active | BOOLEAN | not null default true |
| created_at | DATETIME | not null |

Indexes:

- unique `short_name`
- index `email_domain`

### users

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| school_id | CHAR(36) | not null, foreign key schools.id |
| name | VARCHAR(120) | not null |
| email | VARCHAR(180) | not null, unique |
| password_hash | VARCHAR(255) | not null |
| avatar_url | VARCHAR(500) | nullable |
| major | VARCHAR(120) | nullable |
| bio | TEXT | nullable |
| verified_student | BOOLEAN | not null default false |
| verification_status | ENUM('pending','verified','rejected') | not null default 'pending' |
| created_at | DATETIME | not null |
| updated_at | DATETIME | not null |

Indexes:

- unique `email`
- index `school_id`
- index `verified_student`

### email_verifications

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| user_id | CHAR(36) | not null, foreign key users.id |
| email | VARCHAR(180) | not null |
| code_hash | VARCHAR(255) | not null |
| expires_at | DATETIME | not null |
| verified_at | DATETIME | nullable |
| created_at | DATETIME | not null |

Indexes:

- index `user_id`
- index `email`
- index `expires_at`

### products

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| school_id | CHAR(36) | not null, foreign key schools.id |
| seller_id | CHAR(36) | not null, foreign key users.id |
| title | VARCHAR(160) | not null |
| description | TEXT | not null |
| price | DECIMAL(10,2) | not null |
| category | ENUM('course_materials','electronics','books','furniture','dorm_home','clothing','transportation','sports_outdoor','tickets_events','free_stuff','other') | not null |
| usage_type | ENUM('course_required','course_recommended','personal_sale','moving_sale','free') | not null default 'personal_sale' |
| condition_value | ENUM('new','like_new','good','fair','poor') | not null |
| status | ENUM('available','pending','sold','removed') | not null default 'available' |
| location | VARCHAR(160) | not null |
| negotiable | BOOLEAN | not null default false |
| is_course_related | BOOLEAN | not null default false |
| view_count | INT | not null default 0 |
| created_at | DATETIME | not null |
| updated_at | DATETIME | not null |

Indexes:

- index `school_id`
- index `seller_id`
- index `category`
- index `status`
- index `created_at`
- full text index on `title`, `description` if supported by the chosen MySQL version.

Note: `condition_value` avoids using `condition` as a reserved or confusing column name. API field remains `condition`.

### product_images

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| product_id | CHAR(36) | not null, foreign key products.id on delete cascade |
| image_url | VARCHAR(500) | not null |
| sort_order | INT | not null default 1 |
| created_at | DATETIME | not null |

Indexes:

- index `product_id`
- index `product_id, sort_order`

### courses

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| school_id | CHAR(36) | not null, foreign key schools.id |
| course_code | VARCHAR(40) | not null |
| normalized_course_code | VARCHAR(40) | not null |
| course_name | VARCHAR(160) | nullable |
| department | VARCHAR(40) | nullable |
| created_at | DATETIME | not null |

Indexes:

- unique `school_id, normalized_course_code`
- index `department`

### product_courses

| Column | Type | Constraints |
| --- | --- | --- |
| product_id | CHAR(36) | primary key part, foreign key products.id on delete cascade |
| course_id | CHAR(36) | primary key part, foreign key courses.id on delete cascade |

Indexes:

- primary key `product_id, course_id`
- index `course_id`

### favorites

| Column | Type | Constraints |
| --- | --- | --- |
| user_id | CHAR(36) | primary key part, foreign key users.id on delete cascade |
| product_id | CHAR(36) | primary key part, foreign key products.id on delete cascade |
| created_at | DATETIME | not null |

Indexes:

- primary key `user_id, product_id`
- index `product_id`

### conversations

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| product_id | CHAR(36) | not null, foreign key products.id |
| buyer_id | CHAR(36) | not null, foreign key users.id |
| seller_id | CHAR(36) | not null, foreign key users.id |
| last_message_at | DATETIME | nullable |
| created_at | DATETIME | not null |
| updated_at | DATETIME | not null |

Indexes:

- unique `product_id, buyer_id, seller_id`
- index `buyer_id`
- index `seller_id`
- index `last_message_at`

### messages

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| conversation_id | CHAR(36) | not null, foreign key conversations.id on delete cascade |
| sender_id | CHAR(36) | not null, foreign key users.id |
| content | TEXT | not null |
| read_at | DATETIME | nullable |
| created_at | DATETIME | not null |

Indexes:

- index `conversation_id, created_at`
- index `sender_id`

MVP read-state rule:

- For one-to-one conversations, `messages.read_at` represents when the recipient read the message.
- Sender's own messages do not need `read_at` to appear as unread.
- If group chats or multi-device read receipts are added later, migrate to `message_reads`.

### message_reads

Optional table for richer read state. Use when implementing detailed read receipts or multi-participant conversations.

| Column | Type | Constraints |
| --- | --- | --- |
| message_id | CHAR(36) | primary key part, foreign key messages.id on delete cascade |
| user_id | CHAR(36) | primary key part, foreign key users.id on delete cascade |
| read_at | DATETIME | not null |

Indexes:

- primary key `message_id, user_id`
- index `user_id, read_at`

### reports

| Column | Type | Constraints |
| --- | --- | --- |
| id | CHAR(36) | primary key |
| reporter_id | CHAR(36) | not null, foreign key users.id |
| product_id | CHAR(36) | nullable, foreign key products.id |
| reported_user_id | CHAR(36) | nullable, foreign key users.id |
| reason | VARCHAR(80) | not null |
| detail | TEXT | nullable |
| status | ENUM('open','reviewing','resolved','dismissed') | not null default 'open' |
| created_at | DATETIME | not null |

Indexes:

- index `reporter_id`
- index `product_id`
- index `reported_user_id`
- index `status`

## Seed Data

### schools

```json
[
  {
    "id": "school_uta",
    "name": "University of Texas at Arlington",
    "shortName": "UTA",
    "emailDomain": "mavs.uta.edu",
    "city": "Arlington",
    "state": "TX",
    "isActive": true
  }
]
```

### sample courses

```json
[
  {
    "id": "course_cse3442",
    "schoolId": "school_uta",
    "courseCode": "CSE 3442",
    "normalizedCourseCode": "CSE3442",
    "courseName": "Embedded Systems",
    "department": "CSE"
  },
  {
    "id": "course_cse1320",
    "schoolId": "school_uta",
    "courseCode": "CSE 1320",
    "normalizedCourseCode": "CSE1320",
    "courseName": "Intermediate Programming",
    "department": "CSE"
  }
]
```

## Ownership Rules

- `products.school_id` must equal the seller's `school_id`.
- Normal student accounts cannot create products for a school other than their verified `users.school_id`.
- `conversations.seller_id` must equal the product `seller_id`.
- `conversations.buyer_id` cannot equal `seller_id`.
- `messages.sender_id` must be either the conversation buyer or seller.
- `messages.read_at` is set only for messages sent by the other participant.
- A user can favorite a product only once.
- Course creation from listing input should upsert by `school_id` and `normalized_course_code`.

## Real-Time Messaging Persistence

- Socket sessions do not replace database persistence.
- Every `message:send` event inserts into `messages` before the backend broadcasts `message:new`.
- `conversations.last_message_at` updates after each persisted message.
- Unread counts are derived from `messages` where `sender_id <> current_user_id` and `read_at IS NULL`.
- Reconnecting clients should call `GET /conversations` and `GET /conversations/:id/messages` to recover missed events.

## Public Profile Data

Profiles are derived primarily from `users` and `products`; no separate table is required for MVP.

Profile fields:

- `users.id`
- `users.school_id`
- `users.name`
- `users.avatar_url`
- `users.major`
- `users.bio`
- `users.verified_student`
- `users.created_at` as `joinedAt`
- active listing count from `products`
- sold listing count from `products`

Do not expose:

- `users.email`
- `users.password_hash`
- verification codes or internal auth fields

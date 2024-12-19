## Project Structure

```
project-root/
├── src/
│   ├── modules/
│   │   ├── tweets/
│   │   │   ├── graphql/                     # GraphQL folder for tweets module
│   │   │   │   ├── tweets.resolver.ts       # GraphQL resolver for tweet operations
│   │   │   ├── dto/                         # DTOs for tweets
│   │   │   │   ├── create-tweet.input.ts
│   │   │   │   ├── update-tweet-permissions.input.ts
│   │   │   ├── events/                      # Event definitions for tweets
│   │   │   │   ├── tweet-permissions-updated.event.ts
│   │   │   ├── listeners/                   # Listeners for tweet events
│   │   │   │   ├── tweet-permissions-updated.listener.ts
│   │   │   ├── models/                      # Models for tweets
│   │   │   │   ├── tweet.model.ts
│   │   │   │   ├── paginatedTweet.model.ts
│   │   │   ├── services/                    # Services for tweets
│   │   │   │   ├── tweets.service.ts
│   │   │   │   ├── readTweet.service.ts
│   │   │   │   ├── tweetAppliedPermissions.service.ts
│   │   │   ├── tweets.module.ts             # Module definition for tweets
│   │   ├── users/
│   │   │   ├── graphql/                     # GraphQL folder for users module
│   │   │   │   ├── users.resolver.ts        # GraphQL resolver for user operations
│   │   │   ├── dto/                         # DTOs for users
│   │   │   │   ├── create-user.input.ts
│   │   │   ├── models/                      # Models for users
│   │   │   │   ├── user.model.ts
│   │   │   ├── services/                    # Services for users
│   │   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts              # Module definition for users
│   │   ├── groups/
│   │   │   ├── graphql/                     # GraphQL folder for groups module
│   │   │   │   ├── groups.resolver.ts       # GraphQL resolver for group operations
│   │   │   ├── dto/                         # DTOs for groups
│   │   │   │   ├── create-group.input.ts
│   │   │   ├── models/                      # Models for groups
│   │   │   │   ├── group.model.ts
│   │   │   ├── services/                    # Services for groups
│   │   │   │   ├── groups.service.ts
│   │   │   ├── groups.module.ts             # Module definition for groups
│   ├── shared/
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   ├── prisma.module.ts
│   ├── main.ts
│   ├── app.module.ts
├── .env
├── .eslintrc.js
├── .gitignore
├── docker-compose.yml
├── package.json
├── tsconfig.json

```

---

## Getting Started

### Running the Project

#### Option 1: Using Docker

1. Ensure Docker is installed on your system.
2. Start the application using:
   ```bash
   docker-compose up
   ```
3. The application will run on port `3000`. Access the GraphQL playground at [http://localhost:3000/graphql](http://localhost:3000/graphql).

#### Option 2: Manual Setup

1. Set up a PostgreSQL instance.
   - **Optional**: If available, enable the Citus extension for distributed and sharded data capabilities.
2. Set up a Redis instance.
   - Ensure Redis is running and set the `REDIS_URL` environment variable in the `.env` file.
3. Create a `.env` file in the project root with the following keys:
   ```env
   DATABASE_URL=your_postgres_url
   REDIS_URL=your_redis_url
   ```
4. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
5. Apply database migrations using Prisma:
   ```bash
   npx prisma migrate dev
   ```
6. Start the application:
   ```bash
   npm run start
   # or
   yarn start
   ```
7. The application will run on port `3000`. Access the GraphQL API at [http://localhost:3000/graphql](http://localhost:3000/graphql).

---

## Design Decisions

1. **PostgreSQL for Data Integrity and Maturity**  
   PostgreSQL was selected for its reliability, maturity, and extensive tooling. Its advanced indexing, relational integrity, and robust ecosystem make it a natural choice for the project’s database needs.

2. **Citus Extension for Scalability**  
   The optional use of the Citus extension provides distributed and sharded data handling, supporting parallel queries and reducing write overhead in high-scale, high-volume scenarios.

3. **Flattened Permissions for High Read Performance**  
   Permissions between users and tweets are flattened to minimize recursive queries and reduce overhead during read operations. This is achieved through event-driven updates (`tweet.permissions.updated`) and queued tasks, ensuring precomputed permissions for efficient tweet reads.

4. **Sharding Strategy**  
   Tweets and groups are sharded by user ID (e.g., `rootAuthorId` for tweets and `creatorId` for groups). This provides scalability but requires careful management to avoid hot spots and ensures that queries respect shard boundaries to avoid cross-shard joins.

5. **Event-Driven Architecture**  
   The event-driven approach enables better scalability and modularity by decoupling different parts of the system. For instance, permission updates are handled asynchronously via a queue system powered by Redis.

6. **Prisma for Database Interaction**  
   Prisma ORM was chosen for its type-safe API, ease of migrations, and developer-friendly interface.

---

## Potential Limitations

1. **PostgreSQL Optimization**  
   The system heavily relies on PostgreSQL performance. This necessitates advanced query optimization, indexing, and careful schema design, especially as data volume grows.

2. **Sharding Challenges**

   - Sharding by user ID can create potential hot spots for users with high activity.
   - Certain read queries might require a distribution key to avoid expensive cross-shard joins, necessitating adjustments to APIs or managing IDs.

3. **Event Overhead**  
   While events decouple the system, they add operational complexity, requiring robust monitoring, error handling, and retries for failed tasks.

---

## Alternative Approaches Considered

1. **Graph Databases**  
   Graph databases like Dgraph were considered for their natural ability to handle relationships and permissions. However, concerns about maturity, tooling, and ecosystem reliability led to the choice of PostgreSQL with the Citus extension.

2. **High Fan-Out Databases**  
   ScyllaDB was evaluated for its ability to handle high-volume data with its efficient sharding mechanism. While attractive for handling large datasets, PostgreSQL was preferred for its maturity, tooling, and widespread support.

3. **CQRS (Command Query Responsibility Segregation)**  
   Separating read and write operations was considered to optimize for complex queries and operations. While not implemented, this approach could be combined with event-driven updates for further scalability.

4. **Caching and Precomputed Timelines**  
   Caching frequently accessed data and precomputing user-specific timelines were considered to reduce database load. This could complement the current approach by offloading repetitive queries.

---

# Database Schema

The schema is designed for use with **Citus**, a distributed PostgreSQL database, and emphasizes sharding to ensure scalability and performance.

---

## Overview

This schema includes the following key entities and features:

1. **User Management**: Tracks users with unique identifiers, usernames, and email addresses.
2. **Groups**: Allows users to create groups with a hierarchical relationship.
3. **Tweets**: Supports hierarchical tweets (e.g., replies), categories, and advanced permissions.
4. **Permissions**: Provides granular permission control at the user and group levels.
5. **Sharding**: Data is distributed across nodes based on specific shard keys like `rootAuthorId` for tweets and `creatorId` for groups.
6. **Flattened Permissions**: Precomputed permissions via the TweetAppliedPermission model, optimizing read queries by reducing the need for joins and recursive queries.

---

## Models

### **User**

Represents individual users on the platform.

- **Fields:**

  - `id`: Primary key (String).
  - `username`: Unique username.
  - `email`: User's email address.
  - `createdAt`: Timestamp of user creation.

- **Relationships:**
  - Users can create multiple groups.
- **Indexes:**
  - Indexed on `username` for fast lookups.

```prisma
model User {
  id        String   @id @map("id")
  username  String    @map("username")
  email     String    @map("email")
  createdAt DateTime @default(now()) @map("created_at")

  Group Group[] // Relationships

  @@index([username])
  @@map("users")
}
```

---

### **Group**

Groups created by users for collaboration or categorization.

- **Fields:**

  - `id`: Composite primary key with `creatorId`.
  - `creatorId`: The user who created the group.
  - `name`: Name of the group.
  - `createdAt`: Timestamp of group creation.

- **Relationships:**

  - A group belongs to one user (`creator`).
  - A group can have multiple members.

- **Sharding:**
  - Sharded by `creatorId` to distribute data across nodes.

```prisma
model Group {
  creatorId    String        @map("creator_id")
  id           String        @map("id")
  name         String        @map("name")
  createdAt    DateTime      @default(now()) @map("created_at")

  groupMembers GroupMember[] // Relationships
  creator User @relation(fields: [creatorId], references: [id])

  @@id([creatorId, id])
  @@map("groups")
}
```

---

### **Tweet**

Represents a tweet, including hierarchical relationships, permissions, and categories.

- **Fields:**

  - `rootAuthorId`: Shard key for distribution.
  - `id`: Composite primary key with `rootAuthorId`.
  - `authorId`: The user who created the tweet.
  - `content`: Text content of the tweet.
  - `hashtags`: Array of hashtags.
  - `parentTweetId`: For hierarchical tweets (e.g., replies).
  - `category`: Enum for tweet categories (e.g., TECH, FINANCE).
  - `inheritViewPermissions`: Indicates if view permissions are inherited.
  - `inheritEditPermissions`: Indicates if edit permissions are inherited.
  - `isPublicView`, `isPublicEdit`: Boolean fields for public access.

- **Relationships:**

  - Supports hierarchical relationships via `parentTweet` and `childTweets`.
  - Links to `TweetAppliedPermission` and `TweetPermissions` for permission control.

- **Sharding:**
  - Sharded by `rootAuthorId`.

```prisma
model Tweet {
  rootAuthorId String @map("root_author_id")
  id           String @map("id")
  authorId     String @map("author_id")
  content      String @map("content") @db.Text
  hashtags     String[] @map("hashtags")

  // Relationships
  parentTweet Tweet? @relation("parent_tweet", fields: [rootAuthorId, parentTweetId], references: [rootAuthorId, id])
  childTweets Tweet[] @relation("parent_tweet")

  @@id([rootAuthorId, id])
  @@index([authorId])
  @@map("tweets")
}
```

---

### **GroupMember**

Represents membership in a group, supporting both users and sub-groups.

- **Fields:**

  - `groupCreatorId`: Creator of the group (shard key).
  - `groupId`: ID of the group.
  - `memberType`: Enum indicating type (USER, GROUP).
  - `memberId`: ID of the member (user or group).

- **Sharding:**
  - Sharded by `groupCreatorId`.

```prisma
model GroupMember {
  groupCreatorId String @map("group_creator_id")
  groupId        String @map("group_id")
  memberType     MemberType @map("member_type")
  memberId       String @map("member_id")

  group Group @relation(fields: [groupCreatorId, groupId], references: [creatorId, id])

  @@id([groupCreatorId, groupId, memberId, memberType])
  @@map("group_members")
}
```

---

### **TweetPermissions**

Stores explicit permissions for tweets.

- **Fields:**

  - `rootAuthorId`: Shard key for distribution.
  - `tweetId`: Associated tweet ID.
  - `type`: Enum for permission type (USER, GROUP).
  - `typeId`: ID of the user or group.
  - `permission`: Enum for permission (CAN_VIEW, CAN_EDIT).

- **Relationships:**

  - Links to the `Tweet` model.

- **Sharding:**
  - Sharded by `rootAuthorId`.

```prisma
model TweetPermissions {
  rootAuthorId String @map("root_author_id")
  tweetId      String @map("tweet_id")
  type         TweetPermissionType @map("type")
  typeId       String @map("type_id")
  permission   TweetPermission @map("permission")

  tweet Tweet @relation(fields: [tweetId, rootAuthorId], references: [id, rootAuthorId])

  @@id([rootAuthorId, tweetId, type, typeId, permission])
  @@map("tweet_permissions")
}
```

---

### **TweetAppliedPermission**

Represents applied permissions for users on specific tweets.

- **Fields:**

  - `rootAuthorId`: Shard key for distribution.
  - `tweetId`: Associated tweet ID.
  - `userId`: ID of the user.
  - `permission`: Enum for permission (CAN_VIEW, CAN_EDIT).

- **Relationships:**
  - Links to the `Tweet` model.

```prisma
model TweetAppliedPermission {
  rootAuthorId String @map("root_author_id")
  tweetId      String @map("tweet_id")
  userId       String @map("user_id")
  permission   TweetPermission @map("permission")

  tweet Tweet @relation(fields: [rootAuthorId, tweetId], references: [rootAuthorId, id])

  @@id([rootAuthorId, tweetId, userId, permission])
  @@map("tweet_applied_permissions")
}
```

---

## Enums

### **MemberType**

Indicates the type of a group member.

```prisma
enum MemberType {
  USER @map("user")
  GROUP @map("group")
}
```

### **TweetCategory**

Specifies categories for tweets.

```prisma
enum TweetCategory {
  SPORT @map("sport")
  FINANCE @map("finance")
  TECH @map("tech")
  NEWS @map("news")
}
```

### **TweetPermission**

Defines possible permissions for tweets.

```prisma
enum TweetPermission {
  CAN_VIEW @map("can_view")
  CAN_EDIT @map("can_edit")
}
```

### **TweetPermissionType**

Indicates the type of permission subject.

```prisma
enum TweetPermissionType {
  USER @map("user")
  GROUP @map("group")
}
```

---

## Key Features

- **Scalability**: Sharding enables distribution across Citus nodes for high scalability.
- **Hierarchical Relationships**: Supports parent-child relationships for tweets and groups.
- **Fine-Grained Permissions**: Flexible and hierarchical permission control.
- **Optimized Indexing**: Indexes on critical fields for performance.
- **Flattened Permissions for Optimization**: TweetAppliedPermission simplifies and accelerates read operations by eliminating the need for complex joins or recursive queries.

# GraphQL API Schema Documentation

## Schema Details

### **Types**

#### **Group**

Represents a group of users or nested sub-groups. Groups are created and managed by a specific user.

- **Fields:**
  - `id: ID!` - Unique identifier for the group.
  - `name: String!` - The name of the group.
  - `creatorId: String!` - The ID of the user who created the group.
  - `userIds: [String!]!` - List of user IDs in the group.
  - `groupIds: [String!]!` - List of nested group IDs.

#### **Tweet**

Represents a tweet authored by a user.

- **Fields:**
  - `id: TweetID!` - Unique ID for the tweet, validated as `{rootAuthorId}_{tweetId}`.
  - `authorId: String!` - ID of the user who authored the tweet.
  - `content: String!` - Content of the tweet.
  - `hashtags: [String!]` - List of hashtags used in the tweet.
  - `parentTweetId: String` - Optional ID of the parent tweet (for replies).
  - `category: TweetCategory` - Optional category of the tweet (e.g., SPORT, FINANCE).
  - `location: String` - Optional location associated with the tweet.

#### **PaginatedTweet**

Encapsulates a paginated list of tweets.

- **Fields:**
  - `nodes: [Tweet!]!` - List of tweet objects.
  - `hasNextPage: Boolean!` - Indicates if more pages are available.

#### **User**

Represents a user in the system.

- **Fields:**
  - `id: ID!` - Unique identifier for the user.
  - `username: String!` - Username of the user.
  - `email: String!` - Email address of the user.
  - `createdAt: DateTime!` - Timestamp of when the user was created.

---

### **Custom Scalars**

#### **TweetID**

A custom scalar validating tweet IDs in the format `{rootAuthorId}_{tweetId}`.

#### **DateTime**

A string representing a date-time in UTC, compliant with ISO 8601 (e.g., `2019-12-03T09:54:33Z`).

---

### **Enums**

#### **TweetCategory**

Defines categories that a tweet can belong to:

- `SPORT`
- `FINANCE`
- `TECH`
- `NEWS`

---

### **Queries**

#### **getUsers**

Fetches a list of all users.

- **Returns:**
  - `[User!]!` - List of user objects.

#### **getUser**

Fetches a specific user by ID.

- **Arguments:**
  - `id: String!` - The ID of the user to retrieve.
- **Returns:**
  - `User` - The user object if found.

#### **getGroupsByCreator**

Fetches all groups created by a specific user.

- **Arguments:**
  - `creatorId: String!` - The ID of the group creator.
- **Returns:**
  - `[Group!]!` - List of groups created by the user.

#### **paginateTweets**

Fetches a paginated list of tweets for a user.

- **Arguments:**
  - `input: PaginateTweets!` - Pagination and filter parameters.
- **Returns:**
  - `PaginatedTweet!` - The paginated tweets object.

#### **paginateTweetsWithCursor**

Fetches a paginated list of tweets using a cursor-based approach.

- **Arguments:**
  - `input: PaginateTweetsWithCursor!` - Cursor and filter parameters.
- **Returns:**
  - `PaginatedTweet!` - The paginated tweets object.

---

### **Mutations**

#### **createUser**

Creates a new user.

- **Arguments:**
  - `input: CreateUserInput!`
    - `username: String!`
    - `email: String!`
- **Returns:**
  - `User!` - The created user object.

#### **createGroup**

Creates a new group.

- **Arguments:**
  - `input: CreateGroupInput!`
    - `creatorId: String!`
    - `name: String!`
    - `userIds: [String!]!`
    - `groupIds: [String!]!`
- **Returns:**
  - `Group!` - The created group object.

#### **createTweet**

Creates a new tweet.

- **Arguments:**
  - `input: CreateTweetInput!`
    - `authorId: String!`
    - `content: String!`
    - `hashtags: [String!]`
    - `parentTweetId: String`
    - `category: TweetCategory`
    - `location: String`
- **Returns:**
  - `Tweet!` - The created tweet object.

#### **updateTweetPermissions**

Updates permissions for a tweet.

- **Arguments:**
  - `tweetId: TweetID!` - The ID of the tweet to update.
  - `input: UpdateTweetPermissionsInput!`
    - `inheritViewPermissions: Boolean!`
    - `inheritEditPermissions: Boolean!`
    - `viewPermissions: [String!]!`
    - `editPermissions: [String!]!`
- **Returns:**
  - `Boolean!` - Success status of the operation.

---

### **Inputs**

#### **PaginateTweets**

Defines parameters for paginating tweets.

- **Fields:**
  - `userId: String!` - ID of the user whose tweets to paginate.
  - `page: Float!` - Page number.
  - `limit: Float!` - Number of tweets per page.
  - `filter: FilterTweet` - Optional filters for tweets.

#### **PaginateTweetsWithCursor**

Defines parameters for cursor-based tweet pagination.

- **Fields:**
  - `userId: String!` - ID of the user whose tweets to paginate.
  - `cursor: String!` - Cursor for fetching the next set of tweets.
  - `limit: Float!` - Number of tweets to fetch.
  - `filter: FilterTweet` - Optional filters for tweets.

#### **FilterTweet**

Defines optional filters for querying tweets.

- **Fields:**
  - `authorId: String` - Filter by author ID.
  - `hashtag: String` - Filter by hashtag.
  - `parentTweetId: String` - Filter by parent tweet ID.
  - `category: TweetCategory` - Filter by category.
  - `location: String` - Filter by location.

#### **CreateUserInput**

Defines input parameters for creating a user.

- **Fields:**
  - `username: String!`
  - `email: String!`

#### **CreateGroupInput**

Defines input parameters for creating a group.

- **Fields:**
  - `creatorId: String!`
  - `name: String!`
  - `userIds: [String!]!`
  - `groupIds: [String!]!`

#### **CreateTweetInput**

Defines input parameters for creating a tweet.

- **Fields:**
  - `authorId: String!`
  - `content: String!`
  - `hashtags: [String!]`
  - `parentTweetId: String`
  - `category: TweetCategory`
  - `location: String`

#### **UpdateTweetPermissionsInput**

Defines input parameters for updating tweet permissions.

- **Fields:**
  - `inheritViewPermissions: Boolean!`
  - `inheritEditPermissions: Boolean!`
  - `viewPermissions: [String!]!`
  - `editPermissions: [String!]!`

---

### **Custom Validation**

- **TweetID Scalar:** Ensures `TweetID` follows the format `{rootAuthorId}_{tweetId}`. Invalid IDs will throw a validation error.

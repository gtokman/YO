# YO!

## App Flow

```mermaid
graph TD
    A[User Registers or Logs In] -->|Provides Credentials| B[Backend Auth Validates]
    B -->|Valid Credentials| C[Generate Session Token]
    C -->|Store in DB| D[User Receives Session Token]
    D --> E[User Makes API Requests]
    E -->|Includes Session Token| F[Backend Validates Session Token]
    F -->|Token Valid| G[Request Processed]
    F -->|Token Invalid| H[Return Unauthorized Error]
    G -->|Example: Send Hi| I[Push Notification Sent to Friend]
    G -->|Example: Search Friends| J[Return Search Results]
    G -->|Example: Delete Account| K[Remove User Data]
    H -->|Re-authentication Required| A
```

## Database Schema

````mermaid
erDiagram
    USERS {
        int id PK
        varchar email
        varchar username
        varchar passwordHash
        timestamp createdAt
    }
    FRIENDS {
        int id PK
        int userId FK
        int friendId FK
        timestamp createdAt
    }
    MESSAGES {
        int id PK
        int senderId FK
        int receiverId FK
        text message
        timestamp sentAt
    }
    SESSIONS {
        int id PK
        int userId FK
        varchar sessionToken
        timestamp createdAt
        timestamp expiresAt
    }

    USERS ||--o{ FRIENDS : "has many friends"
    USERS ||--o{ MESSAGES : "sends many messages"
    USERS ||--o{ SESSIONS : "has many sessions"
    FRIENDS ||--|| USERS : "links to a user"
    FRIENDS ||--|| USERS : "links to a friend"
    MESSAGES ||--|| USERS : "sent by a user"
    MESSAGES ||--|| USERS : "received by a user"
    ```
````

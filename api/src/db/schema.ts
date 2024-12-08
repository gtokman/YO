import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { v4 } from "uuid";

export const usersTable = mysqlTable("users", {
  id: varchar({ length: 36 }).primaryKey().default(v4()),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 50 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  pushToken: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow(),
});

export const friendsTable = mysqlTable(
  "friends",
  {
    id: varchar({ length: 36 }).primaryKey().default(v4()),
    userId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    friendId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueFriendship: uniqueIndex("friends_user_friend_unique").on(
      table.userId,
      table.friendId
    ),
  })
);

export const messagesTable = mysqlTable("messages", {
  id: varchar({ length: 36 }).primaryKey().default(v4()),
  senderId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  receiverId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  message: text().notNull(),
  sentAt: timestamp().defaultNow(),
});

export const sessionsTable = mysqlTable("sessions", {
  id: varchar({ length: 36 }).primaryKey().default(v4()),
  userId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  sessionToken: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp().defaultNow(),
  expiresAt: timestamp().notNull(),
});

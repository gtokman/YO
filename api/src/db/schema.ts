import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  int,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

export const usersTable = mysqlTable("users", {
  id: varchar({ length: 36 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 50 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  salt: varchar({ length: 255 }).notNull(),
  iterationCount: int().notNull(),
  pushToken: varchar({ length: 255 }),
  createdAt: timestamp({
    fsp: 3,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
});

export const friendsTable = mysqlTable(
  "friends",
  {
    id: varchar({ length: 36 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    friendId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp({
      fsp: 3,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueFriendship: uniqueIndex("friends_user_friend_unique").on(
      table.userId,
      table.friendId
    ),
  })
);

export const messagesTable = mysqlTable("messages", {
  id: varchar({ length: 36 })
    .primaryKey()
    .$defaultFn(() => createId()),
  senderId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  receiverId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  message: text().notNull(),
  sentAt: timestamp({
    fsp: 3,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
});

export const sessionsTable = mysqlTable("sessions", {
  id: varchar({ length: 36 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar({ length: 36 })
    .notNull()
    .references(() => usersTable.id),
  sessionToken: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp({
    fsp: 3,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp({
    fsp: 3,
    mode: "date",
  }).notNull(),
});

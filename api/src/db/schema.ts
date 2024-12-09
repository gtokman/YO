import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  int,
  mysqlEnum,
  boolean,
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

export const friendRequestsTable = mysqlTable(
  "friend_requests",
  {
    id: varchar({ length: 36 })
      .primaryKey()
      .$defaultFn(() => createId()),
    senderId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    receiverId: varchar({ length: 36 })
      .notNull()
      .references(() => usersTable.id),
    status: mysqlEnum(["pending", "accepted", "rejected"])
      .notNull()
      .default("pending"),
    createdAt: timestamp({
      fsp: 3,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({
      fsp: 3,
      mode: "date",
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueRequest: uniqueIndex("friend_requests_sender_receiver_unique").on(
      table.senderId,
      table.receiverId
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
  didRead: boolean().notNull().default(false),
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

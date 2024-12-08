import {
  usersTable,
  friendsTable,
  messagesTable,
  sessionsTable,
} from "./schema";

export const InsertUser = usersTable.$inferInsert;
export const SelectUser = usersTable.$inferSelect;

export const InsertFriend = friendsTable.$inferInsert;
export const SelectFriend = friendsTable.$inferSelect;

export const InsertMessage = messagesTable.$inferInsert;
export const SelectMessage = messagesTable.$inferSelect;

export const InsertSession = sessionsTable.$inferInsert;
export const SelectSession = sessionsTable.$inferSelect;

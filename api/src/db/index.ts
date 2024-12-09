import { isProduction } from "@/environment";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/mysql2";

export const db = drizzle({
  connection: isProduction
    ? process.env.MYSQL_URL!
    : process.env.MYSQL_PUBLIC_URL!,
  schema,
  casing: "snake_case",
  mode: "default",
});

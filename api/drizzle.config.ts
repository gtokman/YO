import { isProduction } from "@/environment";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: isProduction ? process.env.MYSQLDATABASE! : process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});

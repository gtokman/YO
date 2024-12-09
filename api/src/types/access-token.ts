import { Type } from "@sinclair/typebox";

export const AccessToken = Type.Transform(
  Type.String({
    pattern: "^Bearer\\s[a-zA-Z0-9\\-_\\.]+$",
  })
)
  .Decode((value) => value.split(" ")[1])
  .Encode((value) => `Bearer ${value}`);

import { Type } from "@sinclair/typebox";

export const EmailPasswordModel = Type.Object(
  {
    email: Type.String({ format: "email" }),
    password: Type.String({
      minLength: 8,
      pattern: "^[a-zA-Z0-9_]+$",
      maxLength: 64,
    }),
  },
  { additionalProperties: false }
);

export const SignUpBodyModel = Type.Composite([
  Type.Object(
    {
      username: Type.String({
        minLength: 2,
        maxLength: 16,
        pattern: "^[a-zA-Z0-9_]+$",
      }),
      fu: Type.Optional(
        Type.String({
          minLength: 36,
          pattern:
            "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
        })
      ),
    },
    { additionalProperties: false }
  ),
  EmailPasswordModel,
]);

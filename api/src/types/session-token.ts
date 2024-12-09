import { Static, Type } from "@sinclair/typebox";

export const SessionToken = Type.Object({
  sub: Type.String(),
  sid: Type.String(),
  iat: Type.Number(),
  exp: Type.Number(),
});

export type SessionToken = Static<typeof SessionToken>;

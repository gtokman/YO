import { ApnsClient } from "apns2";

const client = new ApnsClient({
  team: process.env.TEAM_ID!,
  keyId: process.env.PUSH_KEY_ID!,
  signingKey: process.env.PUSH_SIGNING_KEY!,
  defaultTopic: process.env.PUSH_TOPIC!,
});

export { client };

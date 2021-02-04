import { SimpleCredentialsProvider } from "./simpleCredentialsProvider";

it("returns undefined for not provided credentials", async () => {
  const provider = new SimpleCredentialsProvider();

  const credentials = await provider.getCredentials();

  expect(credentials).toBeUndefined();
});

it("returns credentials for provided credentials", async () => {
  const provider = new SimpleCredentialsProvider({
    accessKeyId: "MOCK_ACCESS_KEY_ID",
    secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
    sessionToken: "MOCK_SESSION_TOKEN",
  });

  const credentials = await provider.getCredentials();

  expect(credentials).toStrictEqual({
    accessKeyId: "MOCK_ACCESS_KEY_ID",
    secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
    sessionToken: "MOCK_SESSION_TOKEN",
  });
});

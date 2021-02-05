import { AssumeRoleCredentialsProvider } from "./assumeRoleCredentialsProvider";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { MetadataBearer } from "@aws-sdk/types";
import {
  Client,
  Command,
  SmithyResolvedConfiguration,
} from "@aws-sdk/smithy-client";

jest.mock("@aws-sdk/client-sts");
let mockSTSSend: jest.Mock;

const oneHourMs = 1000 * 60 * 60;

beforeAll(() => {
  process.env.AWS_REGION = "eu-central-1";
  jest.useFakeTimers("modern");
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  mockSTSSend = mockSend(STSClient);
  mockSTSSend.mockImplementation((command) => {
    if (command instanceof AssumeRoleCommand) {
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);

      return {
        Credentials: {
          AccessKeyId: "MOCK_ACCESS_KEY_ID",
          SecretAccessKey: "MOCK_SECRET_ACCESS_KEY",
          SessionToken: "MOCK_SESSION_TOKEN",
          Expiration: expiration,
        },
      };
    }
  });
});

it("returns credentials from assumed role", async () => {
  const provider = new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
    region: "eu-west-1",
  });

  const credentials = await provider.getCredentials();

  expect(credentials).toStrictEqual({
    accessKeyId: "MOCK_ACCESS_KEY_ID",
    secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
    sessionToken: "MOCK_SESSION_TOKEN",
  });
});

it("uses provided region", async () => {
  new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
    region: "eu-west-1",
  });

  expect(STSClient as jest.Mock).toBeCalledWith({ region: "eu-west-1" });
});

it("uses region from env if not provided", async () => {
  new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
  });

  expect(STSClient as jest.Mock).toBeCalledWith({ region: "eu-central-1" });
});

it("does not assume role again with active credentials", async () => {
  const provider = new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
  });

  await provider.getCredentials();
  await provider.getCredentials();

  expect(mockSTSSend).toBeCalledTimes(1);
});

it("assumes role again when credentials expired", async () => {
  const provider = new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
    expirationMarginSec: 5,
  });

  await provider.getCredentials();
  jest.advanceTimersByTime(oneHourMs);
  await provider.getCredentials();

  expect(mockSTSSend).toBeCalledTimes(2);
});

it("assumes role again in credentials expiration margin", async () => {
  const provider = new AssumeRoleCredentialsProvider({
    roleArn: "arn:aws:iam::111111111111:role/MockRole",
    expirationMarginSec: 15,
  });

  await provider.getCredentials();
  jest.advanceTimersByTime(oneHourMs - 1000 * 10);
  await provider.getCredentials();

  expect(mockSTSSend).toBeCalledTimes(2);
});

export const mockSend = <
  HandlerOptions,
  ClientInput extends object, // eslint-disable-line @typescript-eslint/ban-types
  ClientOutput extends MetadataBearer,
  ResolvedClientConfiguration extends SmithyResolvedConfiguration<HandlerOptions>,
  InputType extends ClientInput,
  OutputType extends ClientOutput
>(
  client: new (config: never) => Client<
    HandlerOptions,
    ClientInput,
    ClientOutput,
    ResolvedClientConfiguration
  >
): jest.Mock<
  unknown,
  [Command<InputType, OutputType, ResolvedClientConfiguration>]
> => {
  const mock = jest.fn<
    unknown,
    [Command<InputType, OutputType, ResolvedClientConfiguration>]
  >();
  (client as jest.Mock).mockImplementation(() => ({
    send: mock,
  }));
  return mock;
};

import axios, { AxiosInstance, Method } from "axios";
import { aws4Interceptor, Credentials, getAuthErrorMessage } from "..";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";

const methods: Method[] = ["GET", "DELETE"];
const dataMethods: Method[] = ["POST", "PATCH", "PUT"];

const region = process.env.AWS_REGION;
const apiGateway = process.env.API_GATEWAY_URL;
const clientRoleArn = process.env.CLIENT_ROLE_ARN;
const assumedClientRoleArn = process.env.ASSUMED_CLIENT_ROLE_ARN;
const service = "execute-api";

let clientCredentials: Credentials;

beforeAll(async () => {
  const sts = new STSClient({ region });
  const { Credentials: credentials } = await sts.send(
    new AssumeRoleCommand({
      RoleArn: clientRoleArn,
      RoleSessionName: "integration-tests",
    })
  );

  clientCredentials = {
    accessKeyId: credentials?.AccessKeyId || "",
    secretAccessKey: credentials?.SecretAccessKey || "",
    sessionToken: credentials?.SessionToken || "",
  };

  cleanEnvCredentials();
});

const setEnvCredentials = () => {
  process.env.AWS_ACCESS_KEY_ID = clientCredentials?.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = clientCredentials?.secretAccessKey;
  process.env.AWS_SESSION_TOKEN = clientCredentials?.sessionToken;
};

const cleanEnvCredentials = () => {
  delete process.env.AWS_PROFILE;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_SESSION_TOKEN;
};

describe("check that API is actually protected", () => {
  it.each([...methods, ...dataMethods])(
    "checks that HTTP %s is protected",
    async (method) => {
      await expect(
        axios.request({ url: apiGateway, method })
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      });
    }
  );
});

describe("with credentials from environment variables", () => {
  let client: AxiosInstance;
  const data = {
    foo: "bar",
  };

  beforeAll(() => {
    setEnvCredentials();
  });
  afterAll(() => {
    cleanEnvCredentials();
  });

  beforeEach(() => {
    client = axios.create();

    client.interceptors.request.use(
      aws4Interceptor({ options: { region, service }, instance: client })
    );
  });

  it.each(methods)("HTTP %s", async (method: Method) => {
    let error;
    let result;
    try {
      result = await client.request({ url: apiGateway, method });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result && result.data.requestContext.http.method).toBe(method);
    expect(result && result.data.requestContext.http.path).toBe("/");
  });

  it.each(dataMethods)("HTTP %s", async (method: Method) => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method,
        data,
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result && result.data.requestContext.http.method).toBe(method);
    expect(result && result.data.requestContext.http.path).toBe("/");
    expect(result && JSON.parse(result.data.body)).toStrictEqual(data);
  });

  it("handles path", async () => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway + "/some/path",
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result && result.data.requestContext.http.path).toBe("/some/path");
  });

  it("handles query parameters", async () => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        params: {
          lorem: 42,
        },
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result && result.data.rawQueryString).toBe("lorem=42");
  });

  it("handles custom headers", async () => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method: "POST",
        headers: { "X-Custom-Header": "Baz" },
        data,
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result?.data.headers["x-custom-header"]).toBe("Baz");
  });

  it("handles custom Content-Type header", async () => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        data,
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result?.data.headers["content-type"]).toBe("application/xml");
  });

  it("sets content type as application/json when the body is an object", async () => {
    let error;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method: "POST",
        data,
      });
    } catch (err) {
      error = getAuthErrorMessage(err);
    }

    expect(error).toBe(undefined);
    expect(result?.status).toEqual(200);
    expect(result?.data.headers["content-type"]).toBe("application/json");
  });
});

describe("signQuery", () => {
  beforeAll(() => {
    setEnvCredentials();
  });

  afterAll(() => {
    cleanEnvCredentials();
  });

  it("respects signQuery option", async () => {
    const client = axios.create();
    client.interceptors.request.use(
      aws4Interceptor({
        instance: client,
        options: {
          region,
          service,
          signQuery: true,
        },
      })
    );

    const result = await client.request({
      url: apiGateway + "/some/path",
      method: "GET",
      params: { foo: "bar" },
    });

    expect(result?.status).toEqual(200);
  });
});

describe("with role to assume", () => {
  let client: AxiosInstance;
  const assumedRoleName = assumedClientRoleArn?.substr(
    assumedClientRoleArn.indexOf("/") + 1
  );

  beforeAll(() => {
    setEnvCredentials();
  });
  afterAll(() => {
    cleanEnvCredentials();
  });

  beforeEach(() => {
    client = axios.create();
    client.interceptors.request.use(
      aws4Interceptor({
        options: { region, service, assumeRoleArn: assumedClientRoleArn },
        instance: client,
      })
    );
  });

  it.each([...methods, ...dataMethods])(
    "signs HTTP %s request with assumed role credentials",
    async (method) => {
      const result = await client.request({ url: apiGateway, method });

      expect(result?.status).toEqual(200);
      expect(
        result && result.data.requestContext.authorizer.iam.userArn
      ).toContain("/" + assumedRoleName + "/");
    }
  );
});

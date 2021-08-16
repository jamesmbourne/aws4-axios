import axios, { AxiosRequestConfig } from "axios";
import { aws4Interceptor } from ".";
import { CredentialsProvider } from "./credentials/credentialsProvider";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

jest.mock("@aws-sdk/signature-v4");
jest.mock("./credentials/assumeRoleCredentialsProvider", () => ({
  AssumeRoleCredentialsProvider: jest.fn(() => ({
    getCredentials: jest.fn().mockResolvedValue({
      accessKeyId: "assumed-access-key-id",
      secretAccessKey: "assumed-secret-access-key",
      sessionToken: "assumed-session-token",
    }),
  })),
}));

const mockCustomProvider: CredentialsProvider = {
  getCredentials: async () => {
    return Promise.resolve({
      accessKeyId: "custom-provider-access-key-id",
      secretAccessKey: "custom-provider-secret-access-key",
      sessionToken: "custom-provider-session-token",
    });
  },
};

const getDefaultHeaders = () => ({
  common: { Accept: "application/json, text/plain, */*" },
  delete: {},
  get: {},
  head: {},
  post: { "Content-Type": "application/x-www-form-urlencoded" },
  put: { "Content-Type": "application/x-www-form-urlencoded" },
  patch: { "Content-Type": "application/x-www-form-urlencoded" },
});

const getDefaultTransformRequest = () => axios.defaults.transformRequest;

beforeEach(() => {
  SignatureV4.prototype.sign = jest.fn().mockResolvedValue({
    headers: {},
  });
  SignatureV4.prototype.presign = jest.fn().mockResolvedValue({
    query: {},
  });
});

describe("interceptor", () => {
  it("signs GET requests", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {},
    });
  });

  it("signs url query paremeters in GET requests", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar?foo=bar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {
        foo: "bar",
      },
    });
  });

  it("signs query paremeters in GET requests", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      params: { foo: "bar" },
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {
        foo: "bar",
      },
    });
  });

  it("signs POST requests with an object payload", async () => {
    // Arrange
    const data = { foo: "bar" };

    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "POST",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Host: "example.com",
      },
      body: '{"foo":"bar"}',
      query: {},
    });
  });

  it("signs POST requests with a string payload", async () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "POST",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: "foobar",
      query: {},
    });
  });

  it("passes Content-Type header to be signed", async () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: { ...getDefaultHeaders(), "Content-Type": "application/xml" },
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "POST",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        "Content-Type": "application/xml",
        Host: "example.com",
      },
      body: "foobar",
      query: {},
    });
  });

  it("works with baseURL config", async () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      baseURL: "https://example.com/foo",
      url: "bar",
      data,
      headers: { ...getDefaultHeaders(), "Content-Type": "application/xml" },
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "POST",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foo/bar",
      headers: {
        "Content-Type": "application/xml",
        Host: "example.com",
      },
      body: "foobar",
      query: {},
    });
  });

  it("passes option to sign the query instead of adding header", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
      signQuery: true,
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(SignatureV4.prototype.presign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {},
    });
  });
});

describe("credentials", () => {
  it("passes provided credentials", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor(
      {
        region: "local",
        service: "execute-api",
      },
      {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {},
    });
  });

  it("gets credentials for given role", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api",
      assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
    });

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "assumed-access-key-id",
        secretAccessKey: "assumed-secret-access-key",
        sessionToken: "assumed-session-token",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {},
    });
  });

  it("prioritizes provided credentials provider over the role", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor(
      {
        region: "local",
        service: "execute-api",
        assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
      },
      mockCustomProvider
    );

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      body: undefined,
      path: "/foobar",
      method: "GET",
      hostname: "example.com",
      headers: {
        Host: "example.com",
      },
      port: undefined,
      protocol: "https:",
      query: {},
    });

    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "custom-provider-access-key-id",
        secretAccessKey: "custom-provider-secret-access-key",
        sessionToken: "custom-provider-session-token",
      },
    });
  });

  it("prioritizes provided credentials over the role", async () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor(
      {
        region: "local",
        service: "execute-api",
        assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
      },
      {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );

    // Act
    await interceptor(request);

    // Assert
    expect(SignatureV4).toBeCalledWith({
      service: "execute-api",
      region: "local",
      sha256: Sha256,
      credentials: {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      },
    });
    expect(SignatureV4.prototype.sign).toBeCalledWith({
      method: "GET",
      protocol: "https:",
      hostname: "example.com",
      port: undefined,
      path: "/foobar",
      headers: {
        Host: "example.com",
      },
      body: undefined,
      query: {},
    });
  });
});

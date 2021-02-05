import { sign } from "aws4";
import axios, { AxiosRequestConfig } from "axios";
import { aws4Interceptor } from ".";

jest.mock("aws4");

jest.mock("./credentials/assumeRoleCredentialsProvider", () => ({
  AssumeRoleCredentialsProvider: jest.fn(() => ({
    getCredentials: jest.fn().mockResolvedValue({
      accessKeyId: "assumed-access-key-id",
      secretAccessKey: "assumed-secret-access-key",
      sessionToken: "assumed-session-token",
    }),
  })),
}));

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
  (sign as jest.Mock).mockReset();
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar?foo=bar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar?foo=bar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar",
        method: "POST",
        region: "local",
        host: "example.com",
        body: '{"foo":"bar"}',
        headers: { "Content-Type": "application/json;charset=utf-8" },
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        method: "POST",
        path: "/foobar",
        region: "local",
        host: "example.com",
        body: "foobar",
        headers: {},
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        method: "POST",
        path: "/foobar",
        region: "local",
        host: "example.com",
        body: "foobar",
        headers: { "Content-Type": "application/xml" },
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        method: "POST",
        path: "/foo/bar",
        region: "local",
        host: "example.com",
        body: "foobar",
        headers: { "Content-Type": "application/xml" },
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        method: "GET",
        path: "/foobar",
        region: "local",
        host: "example.com",
        headers: {},
        signQuery: true,
      },
      undefined
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      {
        accessKeyId: "assumed-access-key-id",
        secretAccessKey: "assumed-secret-access-key",
        sessionToken: "assumed-session-token",
      }
    );
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
    expect(sign).toBeCalledWith(
      {
        service: "execute-api",
        path: "/foobar",
        method: "GET",
        region: "local",
        host: "example.com",
        headers: {},
      },
      {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );
  });
});

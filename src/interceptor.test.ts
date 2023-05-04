import { sign } from "aws4";
import axios, {
  AxiosHeaders,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from "axios";

import { aws4Interceptor } from ".";
import { CredentialsProvider } from "./credentials/credentialsProvider";

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

const mockCustomProvider: CredentialsProvider = {
  getCredentials: async () => {
    return Promise.resolve({
      accessKeyId: "custom-provider-access-key-id",
      secretAccessKey: "custom-provider-secret-access-key",
      sessionToken: "custom-provider-session-token",
    });
  },
};

const getDefaultHeaders = (): AxiosRequestHeaders => new AxiosHeaders();

const getDefaultTransformRequest = () => axios.defaults.transformRequest;

beforeEach(() => {
  (sign as jest.Mock).mockReset();
});

describe("interceptor", () => {
  it("signs GET requests", async () => {
    // Arrange
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar?foo=bar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      params: { foo: "bar" },
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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

    const request: InternalAxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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
        headers: { "Content-Type": "application/json" },
      },
      undefined
    );
  });

  it("signs POST requests with a string payload", async () => {
    // Arrange
    const data = "foobar";
    const request: InternalAxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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
    const request: InternalAxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: new AxiosHeaders({
        ...getDefaultHeaders(),
        "Content-Type": "application/xml",
      }),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      instance: axios,
      options: {
        region: "local",
        service: "execute-api",
      },
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
    const request: InternalAxiosRequestConfig = {
      method: "POST",
      baseURL: "https://example.com/foo",
      url: "bar",
      data,
      headers: new AxiosHeaders({
        ...getDefaultHeaders(),
        "Content-Type": "application/xml",
      }),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
      },
      instance: axios,
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
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      instance: axios,
      options: {
        region: "local",
        service: "execute-api",
        signQuery: true,
      },
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
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      instance: axios,
      options: {
        region: "local",
        service: "execute-api",
      },
      credentials: {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      },
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
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );
  });

  it("gets credentials for given role", async () => {
    // Arrange
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      instance: axios,
      options: {
        region: "local",
        service: "execute-api",
        assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
      },
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

  it("prioritizes provided credentials provider over the role", async () => {
    // Arrange
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
        assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
      },
      credentials: mockCustomProvider,
      instance: axios,
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
        accessKeyId: "custom-provider-access-key-id",
        secretAccessKey: "custom-provider-secret-access-key",
        sessionToken: "custom-provider-session-token",
      }
    );
  });

  it("prioritizes provided credentials over the role", async () => {
    // Arrange
    const request: InternalAxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest(),
    };

    const interceptor = aws4Interceptor({
      options: {
        region: "local",
        service: "execute-api",
        assumeRoleArn: "arn:aws:iam::111111111111:role/MockRole",
      },
      credentials: {
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      },
      instance: axios,
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
        accessKeyId: "access-key-id",
        secretAccessKey: "secret-access-key",
        sessionToken: "session-token",
      }
    );
  });
});

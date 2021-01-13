import { sign } from "aws4";
import axios, { AxiosRequestConfig } from "axios";
import { aws4Interceptor } from ".";

jest.mock("aws4");

describe("interceptor", () => {
  const getDefaultHeaders = () => ({
    common: { Accept: "application/json, text/plain, */*" },
    delete: {},
    get: {},
    head: {},
    post: { "Content-Type": "application/x-www-form-urlencoded" },
    put: { "Content-Type": "application/x-www-form-urlencoded" },
    patch: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const getDefaultTransformRequest = () => axios.defaults.transformRequest;

  beforeEach(() => {
    (sign as jest.Mock).mockReset();
  });

  it("signs GET requests", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      path: "/foobar",
      method: "GET",
      region: "local",
      host: "example.com",
      headers: {}
    }, undefined);
  });

  it("signs url query paremeters in GET requests", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar?foo=bar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      path: "/foobar?foo=bar",
      method: "GET",
      region: "local",
      host: "example.com",
      headers: {}
    }, undefined);
  });

  it("signs query paremeters in GET requests", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      params: {foo: "bar"},
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      path: "/foobar?foo=bar",
      method: "GET",
      region: "local",
      host: "example.com",
      headers: {}
    }, undefined);
  });

  it("signs POST requests with an object payload", () => {
    // Arrange
    const data = { foo: "bar" };

    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      path: "/foobar",
      method: "POST",
      region: "local",
      host: "example.com",
      body: '{"foo":"bar"}',
      headers: { "Content-Type": "application/json;charset=utf-8" }
    }, undefined);
  });

  it("signs POST requests with a string payload", () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      method: "POST",
      path: "/foobar",
      region: "local",
      host: "example.com",
      body: "foobar",
      headers: {}
    }, undefined);
  });

  it("passes Content-Type header to be signed", () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data,
      headers: { ...getDefaultHeaders(), "Content-Type": "application/xml" },
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      method: "POST",
      path: "/foobar",
      region: "local",
      host: "example.com",
      body: "foobar",
      headers: { "Content-Type": "application/xml" }
    }, undefined);
  });

  it("works with baseURL config", () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      baseURL: "https://example.com/foo",
      url: "bar",
      data,
      headers: { ...getDefaultHeaders(), "Content-Type": "application/xml" },
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      method: "POST",
      path: "/foo/bar",
      region: "local",
      host: "example.com",
      body: "foobar",
      headers: { "Content-Type": "application/xml" }
    }, undefined);
  });

  it("passes the credentials", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar",
      headers: getDefaultHeaders(),
      transformRequest: getDefaultTransformRequest()
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    }, {
      accessKeyId: 'access-key-id',
      secretAccessKey: 'secret-access-key',
      sessionToken: 'session-token'
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      service: "execute-api",
      path: "/foobar",
      method: "GET",
      region: "local",
      host: "example.com",
      headers: {}
    }, {
      accessKeyId: 'access-key-id',
      secretAccessKey: 'secret-access-key',
      sessionToken: 'session-token'
    });
  });
});

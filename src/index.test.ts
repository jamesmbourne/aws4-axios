import { sign } from "aws4";
import { AxiosRequestConfig } from "axios";
import { aws4Interceptor } from ".";

jest.mock("aws4");

describe("interceptor", () => {
  beforeEach(() => {
    (sign as jest.Mock).mockReset();
  });

  it("signs GET requests", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar"
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      headers: {},
      service: "execute-api",
      path: "/foobar",
      region: "local",
      host: "example.com"
    });
  });

  it("signs query paremeters in GET requests", () => {
    // Arrange
    const request: AxiosRequestConfig = {
      method: "GET",
      url: "https://example.com/foobar?foo=bar"
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      headers: {},
      service: "execute-api",
      path: "/foobar?foo=bar",
      region: "local",
      host: "example.com"
    });
  });

  it("signs POST requests with an object payload", () => {
    // Arrange
    const data = { foo: "bar" };
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      headers: {},
      service: "execute-api",
      path: "/foobar",
      region: "local",
      host: "example.com",
      body: '{"foo":"bar"}'
    });
  });

  it("signs POST requests with a string payload", () => {
    // Arrange
    const data = "foobar";
    const request: AxiosRequestConfig = {
      method: "POST",
      url: "https://example.com/foobar",
      data
    };

    const interceptor = aws4Interceptor({
      region: "local",
      service: "execute-api"
    });

    // Act
    interceptor(request);

    // Assert
    expect(sign).toBeCalledWith({
      headers: {},
      service: "execute-api",
      path: "/foobar",
      region: "local",
      host: "example.com",
      body: "foobar"
    });
  });
});

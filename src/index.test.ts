import { sign } from "aws4";
import { AxiosRequestConfig } from "axios";
import { aws4Interceptor } from ".";

jest.mock("aws4");

describe("interceptor", () => {
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
});

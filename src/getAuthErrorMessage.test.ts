import { AxiosError, AxiosHeaders } from "axios";
import { getAuthErrorMessage } from ".";

describe("getAuthErrorMessage", () => {
  it("should return the message from the error", () => {
    // Arrange
    const message = "Fake envalid credentials error";

    const error = new AxiosError(
      "Fake envalid credentials error",
      undefined,
      undefined,
      undefined,
      {
        data: {
          message,
        },
        statusText: "Forbidden",
        status: 403,
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );

    // Act
    const actual = getAuthErrorMessage(error as AxiosError);

    // Assert
    expect(actual).toEqual(message);
  });

  it("should return undefined if no error is present", () => {
    // Arrange
    const error = new AxiosError(
      "Just some other error",
      undefined,
      undefined,
      undefined,
      {
        data: {},
        statusText: "OK",
        status: 200,
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );

    // Act
    const actual = getAuthErrorMessage(error as AxiosError);

    // Assert
    expect(actual).toBeUndefined();
  });
});

import { getAuthErrorMessage } from ".";
import { AxiosError } from "axios";

describe("getAuthErrorMessage", () => {
  it("should return the message from the error", () => {
    // Arrange
    const message = "Fake envalid credentials error";

    const error = { response: { data: { message } } };

    // Act
    const actual = getAuthErrorMessage(error as AxiosError);

    // Assert
    expect(actual).toEqual(message);
  });

  it("should return undefined if no error is present", () => {
    // Arrange
    const message = "Fake envalid credentials error";

    const error = { response: {} };

    // Act
    const actual = getAuthErrorMessage(error as AxiosError);

    // Assert
    expect(actual).toBeUndefined();
  });
});

import { AxiosError } from "axios";

interface APIGatewayAuthResponse {
  message?: string;
}
/**
 * Utility method for extracting the error message from an API gateway 403
 *
 * @param error The error thrown by Axios
 */
export const getAuthErrorMessage = (error: AxiosError): string | undefined => {
  const data: APIGatewayAuthResponse = error.response && error.response.data;

  if (data) {
    return data.message;
  }
};

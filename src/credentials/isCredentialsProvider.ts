import { CredentialsProvider } from "./credentialsProvider";

// type guard
export const isCredentialsProvider = (
  variableToCheck: unknown
): variableToCheck is CredentialsProvider =>
  (variableToCheck as CredentialsProvider)?.getCredentials !== undefined;

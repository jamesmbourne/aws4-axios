import { Credentials } from "../interceptor";

export interface CredentialsProvider {
  getCredentials(): Promise<Credentials | undefined>;
}

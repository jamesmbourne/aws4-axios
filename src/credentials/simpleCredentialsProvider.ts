import { CredentialsProvider } from "./credentialsProvider";
import { Credentials } from "../interceptor";

export class SimpleCredentialsProvider implements CredentialsProvider {
  constructor(private readonly credentials?: Credentials) {}

  getCredentials(): Promise<Credentials | undefined> {
    return Promise.resolve(this.credentials);
  }
}

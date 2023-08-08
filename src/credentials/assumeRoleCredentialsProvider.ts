import {
  AssumeRoleCommand,
  Credentials as STSCredentials,
  STSClient,
} from "@aws-sdk/client-sts";
import { CredentialsProvider } from "./credentialsProvider";
import { Credentials } from "../interceptor";

export class AssumeRoleCredentialsProvider implements CredentialsProvider {
  private options: ResolvedAssumeRoleCredentialsProviderOptions;
  private sts: STSClient;
  private credentials?: Credentials;
  private expiration?: Date;

  constructor(options: AssumeRoleCredentialsProviderOptions) {
    this.options = {
      ...options,
      region: options.region || process.env.AWS_REGION,
      expirationMarginSec: options.expirationMarginSec || 5,
      roleSessionName: options.roleSessionName || "axios",
    };

    this.sts = new STSClient({ region: this.options.region });
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.credentials || this.areCredentialsExpired()) {
      const stsCredentials = await this.assumeRole();
      this.credentials = {
        accessKeyId: stsCredentials.AccessKeyId || "",
        secretAccessKey: stsCredentials.SecretAccessKey || "",
        sessionToken: stsCredentials.SessionToken,
      };
      this.expiration = stsCredentials.Expiration;
    }

    return this.credentials;
  }

  private areCredentialsExpired(): boolean {
    return (
      this.expiration !== undefined &&
      new Date().getTime() + this.options.expirationMarginSec * 1000 >=
        this.expiration.getTime()
    );
  }

  private async assumeRole(): Promise<STSCredentials> {
    const res = await this.sts.send(
      new AssumeRoleCommand({
        RoleArn: this.options.roleArn,
        RoleSessionName: this.options.roleSessionName,
      })
    );

    if (!res.Credentials) {
      throw new Error("Failed to get credentials from the assumed role");
    }

    return res.Credentials;
  }
}

export interface AssumeRoleCredentialsProviderOptions {
  roleArn: string;
  region?: string;
  expirationMarginSec?: number;
  roleSessionName?: string;
}

export interface ResolvedAssumeRoleCredentialsProviderOptions {
  roleArn: string;
  region?: string;
  expirationMarginSec: number;
  roleSessionName: string;
}

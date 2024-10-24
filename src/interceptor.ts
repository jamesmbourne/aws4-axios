import { Request as AWS4Request, sign } from "aws4";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
  Method,
} from "axios";

import { OutgoingHttpHeaders } from "http";
import { CredentialsProvider } from ".";
import { AssumeRoleCredentialsProvider } from "./credentials/assumeRoleCredentialsProvider";
import { isCredentialsProvider } from "./credentials/isCredentialsProvider";
import { SimpleCredentialsProvider } from "./credentials/simpleCredentialsProvider";
import { createHash } from "crypto";

export interface InterceptorOptions {
  /**
   * Target service. Will use default aws4 behavior if not given.
   */
  service?: string;
  /**
   * AWS region name. Will use default aws4 behavior if not given.
   */
  region?: string;
  /**
   * Whether to sign query instead of adding Authorization header. Default to false.
   */
  signQuery?: boolean;
  /**
   * Whether to add a X-Amz-Content-Sha256 header.
   */
  addContentSha?: boolean;
  /**
   * ARN of the IAM Role to be assumed to get the credentials from.
   * The credentials will be cached and automatically refreshed as needed.
   * Will not be used if credentials are provided.
   */
  assumeRoleArn?: string;
  /**
   * Number of seconds before the assumed Role expiration
   * to invalidate the cache.
   * Used only if assumeRoleArn is provided.
   */
  assumedRoleExpirationMarginSec?: number;
  /**
   * An identifier for the assumed role session.
   * Use the role session name to uniquely identify a session when the same role is
   * assumed by different principals or for different reasons.
   * In cross-account scenarios, the role session name is visible to,
   * and can be logged by the account that owns the role.
   */
  assumeRoleSessionName?: string;
}

export interface SigningOptions {
  host?: string;
  headers?: AxiosRequestHeaders;
  path?: string;
  body?: unknown;
  region?: string;
  service?: string;
  signQuery?: boolean;
  addContentSha?: boolean;
  method?: string;
}

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export type InternalAxiosHeaders = Record<
  Method | "common",
  Record<string, string>
>;

const removeUndefined = <T>(obj: Record<string, T>) => {
  const newObj: Record<string, T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      newObj[key] = value;
    }
  }

  return newObj;
};

/**
 * Create an interceptor to add to the Axios request chain. This interceptor
 * will sign requests with the AWSv4 signature.
 *
 * @example
 * axios.interceptors.request.use(
 *     aws4Interceptor({ region: "eu-west-2", service: "execute-api" })
 * );
 *
 * @param options The options to be used when signing a request
 * @param credentials Credentials to be used to sign the request
 */
// this would be a breaking change to the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const aws4Interceptor = <D = any>({
  instance = axios,
  credentials,
  options,
}: {
  instance?: AxiosInstance;
  options?: InterceptorOptions;
  credentials?: Credentials | CredentialsProvider;
}): ((
  config: InternalAxiosRequestConfig<D>,
) => Promise<InternalAxiosRequestConfig<D>>) => {
  let credentialsProvider: CredentialsProvider;

  if (isCredentialsProvider(credentials)) {
    credentialsProvider = credentials;
  } else if (options?.assumeRoleArn && !credentials) {
    credentialsProvider = new AssumeRoleCredentialsProvider({
      roleArn: options.assumeRoleArn,
      region: options.region,
      expirationMarginSec: options.assumedRoleExpirationMarginSec,
      roleSessionName: options.assumeRoleSessionName,
    });
  } else {
    credentialsProvider = new SimpleCredentialsProvider(credentials);
  }

  return async (config) => {
    const url = instance.getUri(config);

    if (!url) {
      throw new Error(
        "No URL present in request config, unable to sign request",
      );
    }

    const { host, pathname, search } = new URL(url);
    const { data, method } = config;
    const headers = config.headers;

    const transformRequest = getTransformer(config);

    transformRequest.bind(config);

    // @ts-expect-error we bound the function to the config object
    const transformedData = transformRequest(data, headers);

    // Remove all the default Axios headers
    const {
      common,
      delete: _delete, // 'delete' is a reserved word
      get,
      head,
      post,
      put,
      patch,
      ...headersToSign
    } = headers as unknown as InternalAxiosHeaders;
    // Axios type definitions do not match the real shape of this object

    const signingOptions: AWS4Request = {
      method: method && method.toUpperCase(),
      host,
      path: pathname + search,
      region: options?.region,
      service: options?.service,
      signQuery: options?.signQuery,
      addContentSha: options?.addContentSha,
      body: transformedData,
      headers: removeUndefined(headersToSign) as unknown as OutgoingHttpHeaders,
    };

    const resolvedCredentials = await credentialsProvider.getCredentials();
    sign(signingOptions, resolvedCredentials);

    if (signingOptions.headers) {
      for (const [key, value] of Object.entries(signingOptions.headers)) {
        config.headers.set(key, value);
      }
    }

    if (signingOptions.signQuery) {
      const originalUrl = new URL(url);
      const signedUrl = new URL(originalUrl.origin + signingOptions.path);

      for (const [key, value] of signedUrl.searchParams.entries()) {
        config.params[key] = value;
      }
    }

    if (signingOptions.addContentSha) {
      config.headers.set('X-Amz-Content-Sha256', createHash('sha256').update(transformedData ?? '', 'utf8').digest('hex'))
    }

    return config;
  };
};

const getTransformer = (config: AxiosRequestConfig) => {
  const { transformRequest } = config;

  if (transformRequest) {
    if (typeof transformRequest === "function") {
      return transformRequest;
    } else if (transformRequest.length) {
      return transformRequest[0];
    }
  }

  throw new Error(
    "Could not get default transformRequest function from Axios defaults",
  );
};

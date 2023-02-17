import { Request as AWS4Request, sign } from "aws4";
import {
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
  Method,
} from "axios";
import buildUrl from "axios/lib/helpers/buildURL";
import combineURLs from "axios/lib/helpers/combineURLs";
import isAbsoluteURL from "axios/lib/helpers/isAbsoluteURL";
import { CredentialsProvider } from ".";
import { AssumeRoleCredentialsProvider } from "./credentials/assumeRoleCredentialsProvider";
import { isCredentialsProvider } from "./credentials/isCredentialsProvider";
import { SimpleCredentialsProvider } from "./credentials/simpleCredentialsProvider";

type FIXME = any;

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
}

export interface SigningOptions {
  host?: string;
  headers?: AxiosRequestHeaders;
  path?: string;
  body?: unknown;
  region?: string;
  service?: string;
  signQuery?: boolean;
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
export const aws4Interceptor = <D = any>(
  options?: InterceptorOptions,
  credentials?: Credentials | CredentialsProvider
): ((
  config: InternalAxiosRequestConfig<D>
) => Promise<InternalAxiosRequestConfig<D>>) => {
  let credentialsProvider: CredentialsProvider;

  if (isCredentialsProvider(credentials)) {
    credentialsProvider = credentials;
  } else if (options?.assumeRoleArn && !credentials) {
    credentialsProvider = new AssumeRoleCredentialsProvider({
      roleArn: options.assumeRoleArn,
      region: options.region,
      expirationMarginSec: options.assumedRoleExpirationMarginSec,
    });
  } else {
    credentialsProvider = new SimpleCredentialsProvider(credentials);
  }

  return async (config) => {
    if (!config.url) {
      throw new Error(
        "No URL present in request config, unable to sign request"
      );
    }

    if (config.params) {
      config.url = buildUrl(config.url, config.params, config.paramsSerializer);
      delete config.params;
    }

    let url = config.url;

    if (config.baseURL && !isAbsoluteURL(config.url)) {
      url = combineURLs(config.baseURL, config.url);
    }

    const { host, pathname, search } = new URL(url);
    const { data, headers, method } = config;

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
    } = headers as any as InternalAxiosHeaders;
    // Axios type definitions do not match the real shape of this object

    const signingOptions: AWS4Request = {
      method: method && method.toUpperCase(),
      host,
      path: pathname + search,
      region: options?.region,
      service: options?.service,
      signQuery: options?.signQuery,
      body: transformedData,
      headers: headersToSign as any,
    };

    const resolvedCredentials = await credentialsProvider.getCredentials();
    sign(signingOptions, resolvedCredentials);

    config.headers = new AxiosHeaders(signingOptions.headers as FIXME);

    if (signingOptions.signQuery) {
      const originalUrl = new URL(config.url);
      const signedUrl = new URL(originalUrl.origin + signingOptions.path);
      config.url = signedUrl.toString();
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
    "Could not get default transformRequest function from Axios defaults"
  );
};

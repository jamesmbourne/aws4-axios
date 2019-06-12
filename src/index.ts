import { sign } from "aws4";
import { AxiosRequestConfig } from "axios";
import { URL } from "url";

interface InterceptorOptions {
  service?: string;
  region?: string;
  signQuery?: boolean;
}

interface SigningOptions {
  host?: string;
  headers?: {};
  path?: string;
  body?: any;
  region?: string;
  service?: string;
  signQuery?: boolean;
}

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
 */
export const aws4Interceptor = (options?: InterceptorOptions) => (
  config: AxiosRequestConfig
) => {
  if (!config.url) {
    throw new Error("No URL present in request config, unable to sign request");
  }

  const { host, pathname, search } = new URL(config.url);

  let region: string | undefined;
  let service: string | undefined;
  let signQuery: boolean | undefined;

  if (options) {
    ({ region, service } = options);
  }

  const signingOptions: SigningOptions = {
    host,
    path: pathname + search,
    headers: {},
    region,
    service,
    ...(signQuery !== undefined ? { signQuery } : {}),
    body: getBody(config.data)
  };

  sign(signingOptions);

  config.headers = signingOptions.headers;

  return config;
};

const getBody = (data: any) => {
  if (typeof data === "string") {
    return data;
  }

  return JSON.stringify(data);
};

/**
 * @deprecated Please use the alternative export of `aws4Interceptor`
 */
export const interceptor = aws4Interceptor;

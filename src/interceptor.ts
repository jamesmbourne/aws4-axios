import { sign } from "aws4";
import { AxiosRequestConfig } from "axios";
import combineURLs from "axios/lib/helpers/combineURLs";
import isAbsoluteURL from "axios/lib/helpers/isAbsoluteURL";
import customURL from "url";

export interface InterceptorOptions {
  service?: string;
  region?: string;
  signQuery?: boolean;
}

export interface SigningOptions {
  host?: string;
  headers?: {};
  path?: string;
  body?: any;
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
export const aws4Interceptor = (options?: InterceptorOptions, credentials?: Credentials) => (
  config: AxiosRequestConfig
) => {
  if (!config.url) {
    throw new Error("No URL present in request config, unable to sign request");
  }


  if (config.baseURL && !isAbsoluteURL(config.url)) {
    url = combineURLs(config.baseURL, config.url);
  }

  const URL = customURL.URL || customURL.Url;
  let url = config.url;

  const { host, pathname, search } = new URL(url);
  const { data, headers, method } = config;

  let region: string | undefined;
  let service: string | undefined;
  let signQuery: boolean | undefined;

  if (options) {
    ({ region, service } = options);
  }

  const transformRequest = getTransformer(config);

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
  } = headers;

  const signingOptions: SigningOptions = {
    method: method && method.toUpperCase(),
    host,
    path: pathname + search,
    region,
    service,
    ...(signQuery !== undefined ? { signQuery } : {}),
    body: transformedData,
    headers: headersToSign
  };

  sign(signingOptions, credentials);

  config.headers = signingOptions.headers;

  return config;
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

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

export const interceptor = (options?: InterceptorOptions) => (
  config: AxiosRequestConfig
) => {
  if (!config.url) {
    throw new Error("No URL present in request config, unable to sign request");
  }

  const { host, pathname } = new URL(config.url);

  let region: string | undefined;
  let service: string | undefined;
  let signQuery: boolean | undefined;

  if (options) {
    ({ region, service, signQuery } = options);
  }

  const signingOptions: SigningOptions = {
    host,
    path: pathname,
    headers: {},
    region,
    service,
    signQuery
  };

  sign(signingOptions);

  config.headers = signingOptions.headers;

  return config;
};

declare module "axios/lib/helpers/combineURLs" {
  function combineURLs(baseURL: string, relativeURL: string): string;

  export default combineURLs;
}

declare module "axios/lib/helpers/isAbsoluteURL" {
  function combineURLs(url: string): boolean;

  export default combineURLs;
}

declare module "axios/lib/helpers/buildURL" {
  function buildURL(
    url: string | undefined,
    params: any,
    paramsSerializer: ((params: any) => string) | undefined
  ): string;
  export default buildURL;
}

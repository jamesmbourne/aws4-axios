declare module "axios/lib/helpers/combineURLs" {
  function combineURLs(baseURL: string, relativeURL: string): string;

  export default combineURLs;
}

declare module "axios/lib/helpers/isAbsoluteURL" {
  function combineURLs(url: string): boolean;

  export default combineURLs;
}

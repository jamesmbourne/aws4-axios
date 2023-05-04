declare module "axios/lib/helpers/buildURL" {
  import { ParamsSerializerOptions } from "axios";

  function buildURL(
    url: string | undefined,
    params: unknown,
    paramsSerializer: ParamsSerializerOptions | undefined
  ): string;
  export default buildURL;
}

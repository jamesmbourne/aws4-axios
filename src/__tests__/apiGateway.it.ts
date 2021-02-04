import axios, { Method } from "axios";
import { aws4Interceptor } from "..";

const methods: Method[] = ["GET", "DELETE", "OPTIONS", "HEAD"];

const dataMethods: Method[] = ["POST", "PATCH", "PUT"];

const apiGateway = process.env.API_GATEWAY_URL;

const region = "us-east-1";

const service = "execute-api";

describe("API Gateway integration", () => {
  it.each(methods)("HTTP %s", async (method: Method) => {
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region, service }));

    const result = await client.request({ url: apiGateway, method });

    expect(result.status).toEqual(200);
  });

  it.each(dataMethods)("HTTP %s", async (method: Method) => {
    const client = axios.create();

    const data = {
      foo: "bar",
    };

    client.interceptors.request.use(aws4Interceptor({ region, service }));

    const result = await client.request({
      url: apiGateway,
      method,
      data,
    });

    expect(result.status).toEqual(200);
  });

  it("handles custom headers", async () => {
    const client = axios.create();

    const data = {
      foo: "bar",
    };

    client.interceptors.request.use(aws4Interceptor({ region, service }));

    const result = await client.request({
      url: apiGateway,
      method: "POST",
      headers: { "X-Custom-Header": "Baz" },
      data,
    });

    expect(result.status).toEqual(200);
  });

  it("handles custom Content-Type header", async () => {
    const client = axios.create();

    const data = {
      foo: "bar",
    };

    client.interceptors.request.use(aws4Interceptor({ region, service }));

    const result = await client.request({
      url: apiGateway,
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      data,
    });

    expect(result.status).toEqual(200);
  });

  it("sets content type as application/json when the body is an object", async () => {
    const client = axios.create();

    const data = {
      foo: "bar",
    };

    client.interceptors.request.use(aws4Interceptor({ region, service }));

    const result = await client.request({
      url: apiGateway,
      method: "POST",
      data,
    });

    expect(result.status).toEqual(200);
  });
});

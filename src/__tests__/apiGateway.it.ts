import axios, { Method } from "axios";
import { interceptor as aws4Interceptor } from "..";
import { getAuthErrorMessage } from "..";

const methods: Method[] = ["GET", "DELETE"];

const dataMethods: Method[] = ["POST", "PATCH", "PUT"];

const apiGateway = process.env.API_GATEWAY_URL;

describe("API Gateway integration", () => {
  it.each(methods)("HTTP %s", async (method: Method) => {
    const client = axios.create();

    client.interceptors.request.use(
      aws4Interceptor({ region: "eu-west-2", service: "execute-api" })
    );

    let message;
    let result;
    try {
      result = await client.request({ url: apiGateway, method });
    } catch (err) {
      message = getAuthErrorMessage(err);
    }

    expect(message).toBe(undefined);
    expect(result && result.status).toEqual(200);
  });

  it.each(dataMethods)("HTTP %s", async (method: Method) => {
    const client = axios.create();

    const data = {
      foo: "bar"
    };

    client.interceptors.request.use(
      aws4Interceptor({ region: "eu-west-2", service: "execute-api" })
    );

    let message;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method,
        data
      });
    } catch (err) {
      message = getAuthErrorMessage(err);
    }

    expect(message).toBe(undefined);
    expect(result && result.status).toEqual(200);
  });

  it("handles custom headers", async () => {
    const client = axios.create();

    const data = {
      foo: "bar"
    };

    client.interceptors.request.use(
      aws4Interceptor({ region: "eu-west-2", service: "execute-api" })
    );

    let message;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method: "POST",
        headers: { "X-Custom-Header": "Baz" },
        data
      });
    } catch (err) {
      message = getAuthErrorMessage(err);
    }

    expect(message).toBe(undefined);
    expect(result && result.status).toEqual(200);
  });

  it("handles custom Content-Type header", async () => {
    const client = axios.create();

    const data = {
      foo: "bar"
    };

    client.interceptors.request.use(
      aws4Interceptor({ region: "eu-west-2", service: "execute-api" })
    );

    let message;
    let result;
    try {
      result = await client.request({
        url: apiGateway,
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        data
      });
    } catch (err) {
      message = getAuthErrorMessage(err);
    }

    expect(message).toBe(undefined);
    expect(result && result.status).toEqual(200);
  });
});

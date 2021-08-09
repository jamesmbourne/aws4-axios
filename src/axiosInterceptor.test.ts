import moxios from "moxios";
import axios from "axios";
import aws4Interceptor from ".";

describe("axios interceptor", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should not mutate request config object", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region: "local" }));

    const url = "https://localhost/foo";
    const config = {
      headers: { "X-Custom-Header": "foo", "Content-Type": "application/json" },
      params: { foo: "bar" },
    };

    moxios.stubOnce("GET", /./, {});

    // Act
    await client.get(url, config);

    // Assert
    const request = moxios.requests.first();
    expect(request.url).toBe(`${url}?foo=bar`);
    expect(config.params).toStrictEqual({ foo: "bar" });
  });

  it("should preserve headers", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region: "local" }));

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    moxios.stubOnce("POST", url, {});

    // Act
    await client.post(url, data, {
      headers: { "X-Custom-Header": "foo", "Content-Type": "application/json" },
    });

    // Assert
    const request = moxios.requests.first();
    expect(request.headers["Content-Type"]).toEqual("application/json");
    expect(request.headers["X-Custom-Header"]).toEqual("foo");
    expect(request.headers["Authorization"]).toContain("AWS");
  });

  it("should preserve default headers - without interceptor", async () => {
    // Arrange
    const client = axios.create();

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    moxios.stubOnce("POST", url, {});

    // Act
    await client.post(url, data, {});

    // Assert
    const request = moxios.requests.first();
    expect(request.headers["Content-Type"]).toEqual(
      "application/json;charset=utf-8"
    );
  });

  it("should preserve default headers - with interceptor", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region: "local" }));

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    moxios.stubOnce("POST", url, {});

    // Act
    await client.post(url, data, {});

    // Assert
    const request = moxios.requests.first();
    expect(request.headers["Content-Type"]).toEqual(
      "application/json;charset=utf-8"
    );
  });
});

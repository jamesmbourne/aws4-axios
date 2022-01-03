import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import aws4Interceptor from ".";

describe("axios interceptor", () => {
  let mock: MockAdapter;
  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
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

    mock.onGet().replyOnce(200, {});

    // Act
    await client.get(url, config);

    // Assert
    const request = mock.history.get[0];
    // const request = moxios.requests.first();
    expect(request.url).toBe(`${url}?foo=bar`);
    expect(config.params).toStrictEqual({ foo: "bar" });
  });

  it("should preserve headers", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region: "local" }));

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    mock.onPost(url).replyOnce(200, {});

    // Act
    await client.post(url, data, {
      headers: { "X-Custom-Header": "foo", "Content-Type": "application/json" },
    });

    // Assert
    const request = mock.history.post[0];
    expect(request.headers?.["Content-Type"]).toEqual("application/json");
    expect(request.headers?.["X-Custom-Header"]).toEqual("foo");
    expect(request.headers?.["Authorization"]).toContain("AWS");
  });

  it("should preserve default headers - without interceptor", async () => {
    // Arrange
    const client = axios.create();

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    mock.onPost(url).replyOnce(200, {});

    // Act
    await client.post(url, data, {});

    // Assert
    const request = mock.history.post[0];
    expect(request.headers?.["Content-Type"]).toEqual("application/json");
  });

  it("should preserve default headers - with interceptor", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(aws4Interceptor({ region: "local" }));

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    mock.onPost(url).replyOnce(200, {});

    // Act
    await client.post(url, data, {});

    // Assert
    const request = mock.history.post[0];
    expect(request.headers?.["Content-Type"]).toEqual("application/json");
  });
});

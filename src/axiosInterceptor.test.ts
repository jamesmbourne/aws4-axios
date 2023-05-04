import axios from "axios";
import nock from "nock";

import aws4Interceptor from ".";

describe("axios interceptor", () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it("should not mutate request config object", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(
      aws4Interceptor({ options: { region: "local" }, instance: axios })
    );

    const url = "http://localhost/foo";
    const config = {
      headers: { "X-Custom-Header": "foo", "Content-Type": "application/json" },
      params: { foo: "bar" },
    };

    // setup nock to return a
    nock(url).get("").query(config.params).reply(200, {});

    // Act
    await client.get(url, config);

    // Assert
    expect(nock.isDone()).toBe(true);
  });

  it("should preserve headers", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(
      aws4Interceptor({ options: { region: "local" }, instance: axios })
    );

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    nock(url)
      .post("")
      .matchHeader("X-Custom-Header", "foo")
      .matchHeader("Content-Type", "application/json")
      .matchHeader("Authorization", /AWS/)
      .reply(200, {});

    // Act
    await client.post(url, data, {
      headers: { "X-Custom-Header": "foo", "Content-Type": "application/json" },
    });

    // Assert
    expect(nock.isDone()).toBe(true);
  });

  it("should preserve default headers - without interceptor", async () => {
    // Arrange
    const client = axios.create();

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    nock(url)
      .matchHeader("Content-Type", "application/json")
      .post("")
      .reply(200, {});

    // Act
    await client.post(url, data, {});

    // Assert
    expect(nock.isDone()).toBe(true);
  });

  it("should preserve default headers - with interceptor", async () => {
    // Arrange
    const client = axios.create();

    client.interceptors.request.use(
      aws4Interceptor({ options: { region: "local" }, instance: axios })
    );

    const data = { foo: "bar" };

    const url = "https://localhost/foo";

    nock(url)
      .matchHeader("Content-Type", "application/json")
      .post("")
      .reply(200, {});

    // Act
    await client.post(url, data, {});

    // Assert
    expect(nock.isDone()).toBe(true);
  });
});

# aws4-axios

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![npm version](https://img.shields.io/npm/v/aws4-axios.svg?style=flat-square)](https://www.npmjs.org/package/aws4-axios)
[![npm downloads](https://img.shields.io/npm/dm/aws4-axios.svg?style=flat-square)](http://npm-stat.com/charts.html?package=aws4-axios)

This is a request interceptor for the Axios HTTP request library to allow requests to be signed with an AWSv4 signature.

This may be useful for accessing AWS services protected with IAM auth such as an API Gateway.

# Installation

| yarn                  | npm                             |
| --------------------- | ------------------------------- |
| `yarn add aws4-axios` | `npm install --save aws4-axios` |

# Compatibility

This interceptor is heavily dependent on Axios internals, so minor changes to them can cause the interceptor to fail.

Please make sure you are using one of the following versions of Axios before submitting issues etc.

| Axios Version       | Supported? |
| ------------------- | ---------- |
| `< 1.4.0`           | ❌ No      |
| `>= 1.4.0 <= 1.6.7` | ✅ Yes     |
| `> 1.6.7`           | Unknown    |

# Usage

To add an interceptor to the default Axios client:

```typescript
import axios from "axios";
import { aws4Interceptor } from "aws4-axios";

const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
  },
});

axios.interceptors.request.use(interceptor);

// Requests made using Axios will now be signed
axios.get("https://example.com/foo").then((res) => {
  // ...
});
```

Or you can add the interceptor to a specific instance of an Axios client:

```typescript
import axios from "axios";
import { aws4Interceptor } from "aws4-axios";

const client = axios.create();

const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
  },
});

client.interceptors.request.use(interceptor);

// Requests made using Axios will now be signed
client.get("https://example.com/foo").then((res) => {
  // ...
});
```

You can also pass AWS credentials in explicitly (otherwise taken from process.env)

```typescript
const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
  },
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
```

You can also pass a custom `CredentialsProvider` factory instead

```typescript
const customCredentialsProvider = {
  getCredentials: async () => {
    return Promise.resolve({
      accessKeyId: "custom-provider-access-key-id",
      secretAccessKey: "custom-provider-secret-access-key",
    });
  },
};

const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
  },
  credentials: customCredentialsProvider,
});
```

Newer services, such as [Amazon OpenSearch Serverless](https://aws.amazon.com/opensearch-service/features/serverless/), require a content SHA. Pass `addContentSha` to `options` to enable adding an `X-Amz-Content-Sha256` header to the request.

```typescript
const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "aoss",
    addContentSha: true,
  },
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
```

# Migration to v3

The interface for options changed in v3. You should now pass a single object with configuration.

The previous options object is now nested under the property `options`.

E.g (v2).

```typescript
const interceptor = aws4Interceptor({
  region: "eu-west-2",
  service: "execute-api",
  assumeRoleArn: "arn:aws:iam::111111111111:role/MyRole",
});
```

would become (v3):

```typescript
const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
    assumeRoleArn: "arn:aws:iam::111111111111:role/MyRole",
  },
});
```

If you passed a custom credential provider, this is now done via the `credentials` property.

E.g (v2).

```typescript
const interceptor = aws4Interceptor(
  {
    region: "eu-west-2",
    service: "execute-api",
  },
  {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  }
);
```

would become (v3):

```typescript
const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
    assumeRoleArn: "arn:aws:iam::111111111111:role/MyRole",
  },
  credentials: {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  },
});
```

## Assuming the IAM Role

You can pass a parameter to assume the IAM Role with AWS STS
and use the assumed role credentials to sign the request.
This is useful when doing cross-account requests.

```typescript
const interceptor = aws4Interceptor({
  options: {
    region: "eu-west-2",
    service: "execute-api",
    assumeRoleArn: "arn:aws:iam::111111111111:role/MyRole",
    assumeRoleSessionName: "MyApiClient", // optional, default value is "axios"
  },
});
```

Obtained credentials are cached and refreshed as needed after they expire.

You can use `expirationMarginSec` parameter to set the number of seconds
before the received credentials expiration time to invalidate the cache.
This allows setting a safety margin. Default to 5 seconds.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/florianbepunkt"><img src="https://avatars.githubusercontent.com/u/8314202?v=4?s=100" width="100px;" alt="Florian Bischoff"/><br /><sub><b>Florian Bischoff</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=florianbepunkt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rubenvanrooij"><img src="https://avatars.githubusercontent.com/u/875349?v=4?s=100" width="100px;" alt="Ruben van Rooij"/><br /><sub><b>Ruben van Rooij</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=rubenvanrooij" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ScaleLeap.com"><img src="https://avatars.githubusercontent.com/u/491247?v=4?s=100" width="100px;" alt="Roman"/><br /><sub><b>Roman</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/pulls?q=is%3Apr+reviewed-by%3Amoltar" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://betterdev.blog"><img src="https://avatars.githubusercontent.com/u/4042673?v=4?s=100" width="100px;" alt="Maciej Radzikowski"/><br /><sub><b>Maciej Radzikowski</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=m-radzikowski" title="Tests">⚠️</a> <a href="https://github.com/jamesmbourne/aws4-axios/commits?author=m-radzikowski" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ballpointcarrot.net"><img src="https://avatars.githubusercontent.com/u/96404?v=4?s=100" width="100px;" alt="Christopher Kruse"/><br /><sub><b>Christopher Kruse</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=ballpointcarrot" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://plus.google.com/photos/104306225331370072882/albums"><img src="https://avatars.githubusercontent.com/u/8565700?v=4?s=100" width="100px;" alt="James Hu"/><br /><sub><b>James Hu</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=james-hu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://code.dblock.org"><img src="https://avatars.githubusercontent.com/u/542335?v=4?s=100" width="100px;" alt="Daniel (dB.) Doubrovkine"/><br /><sub><b>Daniel (dB.) Doubrovkine</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=dblock" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/frtelg"><img src="https://avatars.githubusercontent.com/u/43170660?v=4?s=100" width="100px;" alt="Franke Telgenhof"/><br /><sub><b>Franke Telgenhof</b></sub></a><br /><a href="https://github.com/jamesmbourne/aws4-axios/commits?author=frtelg" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

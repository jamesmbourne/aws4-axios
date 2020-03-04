# aws4-axios

[![npm version](https://img.shields.io/npm/v/aws4-axios.svg?style=flat-square)](https://www.npmjs.org/package/aws4-axios)
[![npm downloads](https://img.shields.io/npm/dm/aws4-axios.svg?style=flat-square)](http://npm-stat.com/charts.html?package=aws4-axios)
[![circleci build](https://img.shields.io/circleci/build/github/jamesmbourne/aws4-axios.svg?style=flat-square)](https://circleci.com/gh/jamesmbourne/aws4-axios)

This is a request interceptor for the Axios HTTP request library to allow requests to be signed with an AWSv4 signature.

This may be useful for accessing AWS services protected with IAM auth such as an API Gateway.

# Installation

| yarn                  | npm                             |
| --------------------- | ------------------------------- |
| `yarn add aws4-axios` | `npm install --save aws4-axios` |

# Usage

To add an interceptor to the default Axios client:

```typescript
import axios from "axios";
import { aws4Interceptor } from "aws4-axios";

const interceptor = aws4Interceptor({
  region: "eu-west-2",
  service: "execute-api"
});

axios.interceptors.request.use(interceptor);

// Requests made using Axios will now be signed
axios.get("https://example.com/foo").then(res => {
  // ...
});
```

Or you can add the interceptor to a specific instance of an Axios client:

```typescript
import axios from "axios";
import { aws4Interceptor } from "aws4-axios";

const client = axios.create();

const interceptor = aws4Interceptor({
  region: "eu-west-2",
  service: "execute-api"
});

client.interceptors.request.use(interceptor);

// Requests made using Axios will now be signed
client.get("https://example.com/foo").then(res => {
  // ...
});
```

You can also pass AWS credentials in explicitly (otherwise taken from process.env)

```typescript
const interceptor = aws4Interceptor({
  region: "eu-west-2",
  service: "execute-api"
}, {
  accessKeyId: '',
  secretAccessKey: ''
});
```
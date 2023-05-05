import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpIamAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class AWSv4AxiosInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    const routeArn = ({
      apiId,
      stage,
      httpMethod,
      path,
    }: {
      apiId: string;
      stage?: string;
      httpMethod: apigatewayv2.HttpMethod;
      path?: string;
    }): string => {
      const iamHttpMethod =
        httpMethod === apigatewayv2.HttpMethod.ANY ? "*" : httpMethod;

      // When the user has provided a path with path variables, we replace the
      // path variable and all that follows with a wildcard.
      const iamPath = (path ?? "/").replace(/\{.*?\}.*/, "*");
      const iamStage = stage ?? "*";

      return `arn:${cdk.Aws.PARTITION}:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:${apiId}/${iamStage}/${iamHttpMethod}${iamPath}`;
    };

    super(scope, id, props);

    const apiHandler = new lambda.NodejsFunction(this, "ApiHandler", {
      entry: "lib/api.ts",
      handler: "handler",
    });

    const authorizer = new HttpIamAuthorizer();

    const api = new apigatewayv2.HttpApi(this, "Api", {
      defaultAuthorizer: authorizer,
      defaultIntegration: new HttpLambdaIntegration(
        "ApiHandlerIntegration",
        apiHandler
      ),
    });

    if (!api.url) {
      throw new Error("api.url is undefined");
    }

    // output URL as HttpApiUrl
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.url,
    });

    const clientRole = new iam.Role(this, "ClientRole", {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // grant the client role access to the API
    clientRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        resources: [
          routeArn({
            apiId: api.httpApiId,
            stage: api.defaultStage?.stageName,
            httpMethod: apigatewayv2.HttpMethod.ANY,
            path: "/*",
          }),
        ],
      })
    );

    // output the client role ARN
    new cdk.CfnOutput(this, "ClientRoleArn", {
      value: clientRole.roleArn,
    });

    // create another role, assumable by the first
    const assumedClientRole = new iam.Role(this, "AssumedClientRole", {
      assumedBy: new iam.ArnPrincipal(clientRole.roleArn),
    });

    // set up an IAM role assumable by GitHub Actions using web identity federation
    const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.WebIdentityPrincipal(
        `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:jamesmbourne/aws4-axios:*",
          },
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
        }
      ),
      // conditions
    });

    this.stackId;

    // grant the GitHub Actions role access to CloudFormation describeStacks this stack
    githubActionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cloudformation:DescribeStacks"],
        resources: [this.stackId],
      })
    );

    clientRole.grantAssumeRole(githubActionsRole);

    // output the GitHub Actions role ARN
    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: githubActionsRole.roleArn,
    });

    // grant the assumed role access to the API
    assumedClientRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        resources: [
          routeArn({
            apiId: api.httpApiId,
            stage: api.defaultStage?.stageName,
            httpMethod: apigatewayv2.HttpMethod.ANY,
            path: "/*",
          }),
        ],
      })
    );

    // output the assumed client role ARN
    new cdk.CfnOutput(this, "AssumedClientRoleArn", {
      value: assumedClientRole.roleArn,
    });
  }
}

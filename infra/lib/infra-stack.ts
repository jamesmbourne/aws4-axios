import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class AWSv4AxiosInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const apiHandler = new lambda.NodejsFunction(this, "ApiHandler", {
      entry: "lib/api.ts",
      handler: "handler",
    });

    const api = new apigateway.LambdaRestApi(this, "Api", {
      handler: apiHandler,
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.IAM,
      },
    });

    // output URL as HttpApiUrl
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.url,
    });

    const clientRole = new iam.Role(this, "ClientRole", {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // allow the client role to invoke the API (not the apiHandler)
    clientRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        resources: [api.arnForExecuteApi()],
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

    // grant the assumed role access to the API
    assumedClientRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        resources: [api.arnForExecuteApi()],
      })
    );

    // output the assumed client role ARN
    new cdk.CfnOutput(this, "AssumedClientRoleArn", {
      value: assumedClientRole.roleArn,
    });

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

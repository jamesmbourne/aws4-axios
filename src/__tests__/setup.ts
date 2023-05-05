import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

const region = process.env.AWS_REGION || "eu-west-2";

module.exports = async () => {
  const stackName = `AWSv4AxiosInfraStack`;

  const cf = new CloudFormationClient({ region });
  const stacks = await cf.send(
    new DescribeStacksCommand({
      StackName: stackName,
    })
  );
  const stack = stacks.Stacks?.[0];

  if (stack === undefined) {
    throw new Error(
      `Couldn't find CloudFormation stack with name ${stackName}`
    );
  }

  process.env.API_GATEWAY_URL = stack.Outputs?.find(
    (o) => o.OutputKey === "HttpApiUrl"
  )?.OutputValue?.replace(/\/$/, "");
  process.env.CLIENT_ROLE_ARN = stack.Outputs?.find(
    (o) => o.OutputKey === "ClientRoleArn"
  )?.OutputValue;
  process.env.ASSUMED_CLIENT_ROLE_ARN = stack.Outputs?.find(
    (o) => o.OutputKey === "AssumedClientRoleArn"
  )?.OutputValue;

  process.env.AWS_REGION = region;
};

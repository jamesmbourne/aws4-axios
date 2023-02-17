import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

const region = process.env.AWS_REGION || "eu-west-2";
const stage = process.env.STAGE || "dev";

module.exports = async () => {
  const stackName = `aws4AxiosIT-${stage}`;

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
  )?.OutputValue;
  process.env.CLIENT_ROLE_ARN = stack.Outputs?.find(
    (o) => o.OutputKey === "ClientRoleArn"
  )?.OutputValue;
  process.env.ASSUMED_CLIENT_ROLE_ARN = stack.Outputs?.find(
    (o) => o.OutputKey === "AssumedClientRoleArn"
  )?.OutputValue;

  console.log(`Found stack URL: ${process.env.API_GATEWAY_URL}`);

  process.env.AWS_REGION = region;
  process.env.STAGE = stage;
};

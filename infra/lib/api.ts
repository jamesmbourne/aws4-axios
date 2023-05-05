import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  return {
    body: JSON.stringify(event),
    statusCode: 200,
  };
};

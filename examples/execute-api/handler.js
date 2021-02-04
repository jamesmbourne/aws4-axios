"use strict";

module.exports.handler = async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "OK",
      },
      null,
      2
    ),
  };
};

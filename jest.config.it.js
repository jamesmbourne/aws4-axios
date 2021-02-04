module.exports = {
  ...require("./jest.config"),
  testMatch: ["**/__tests__/**/*.it.[jt]s?(x)"],
  globalSetup: "./src/__tests__/setup.ts",
};

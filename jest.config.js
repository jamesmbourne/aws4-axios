module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["./dist/"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"]
};

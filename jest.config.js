module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["./dist/"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleNameMapper: {
    axios: "axios/dist/node/axios.cjs",
    "axios/lib/*": "axios/dist/node/lib/*",
  },
};

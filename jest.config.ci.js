module.exports = {
  ...require("./jest.config"),
  reporters: [["jest-junit", { output: "reports/junit/test-results.xml" }]]
};

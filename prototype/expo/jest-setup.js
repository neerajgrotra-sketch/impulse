import { setUpTests } from "react-native-reanimated";

setUpTests();

jest.mock("react-native-safe-area-context", () => {
  const mock = require("react-native-safe-area-context/jest/mock");
  return mock.default ?? mock;
});

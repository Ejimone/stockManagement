// Test script to verify price formatting
const { formatPrice, formatCurrency } = require("./utils/formatters.ts");

console.log("Testing price formatting:");

// Test cases
const testCases = [
  { input: 100.0, expected: "₦100.00", description: "Number (float) from API" },
  {
    input: "199.99",
    expected: "₦199.99",
    description: "String number from API (old format)",
  },
  { input: 0, expected: "₦0.00", description: "Zero value" },
  { input: undefined, expected: "₦0.00", description: "Undefined value" },
  { input: null, expected: "₦0.00", description: "Null value" },
  { input: "invalid", expected: "₦0.00", description: "Invalid string" },
  { input: 29.99, expected: "₦29.99", description: "Regular price" },
];

testCases.forEach(({ input, expected, description }) => {
  const result = formatCurrency(input);
  const passed = result === expected;
  console.log(
    `${
      passed ? "✅" : "❌"
    } ${description}: ${input} -> ${result} (expected: ${expected})`
  );
});

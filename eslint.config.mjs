import mskelton from "@mskelton/eslint-config"

export default [
  ...mskelton.recommended,
  {
    ignores: [".yarn/**"],
  },
  {
    files: ["test/fixtures/**"],
    rules: {
      "no-empty-pattern": "off",
    },
  },
]

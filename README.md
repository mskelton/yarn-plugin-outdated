# Yarn Plugin Outdated

Yarn plugin to show outdated dependencies.

## Installation

```sh
yarn plugin import https://github.com/mskelton/yarn-plugin-outdated/raw/v2.1.0/bundles/@yarnpkg/plugin-outdated.js
```

## Examples

View outdated dependencies:

```sh
yarn outdated
```

View outdated dependencies with the `@babel` scope:

```sh
yarn outdated '@babel/*'
```

### Options

| Definition      | Description                                              |
| --------------- | -------------------------------------------------------- |
| `-a`, `--all`   | Include outdated dependencies from all workspaces.       |
| `-c`, `--check` | Return exit code 1 if outdated dependencies are found.   |
| `--url`         | Include the homepage URL of each package in the output.  |
| `--json`        | Output in JSON format instead of in the formatted table. |

# Yarn Plugin Outdated

Yarn 2 plugin to show outdated dependencies.

## Installation

```sh
yarn plugin import https://github.com/mskelton/yarn-plugin-outdated/raw/main/bundles/@yarnpkg/plugin-outdated.js
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
| `--json`        | Output in JSON format instead of in the formatted table. |

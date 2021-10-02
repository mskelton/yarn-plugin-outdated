# Yarn Plugin Outdated

Yarn plugin to show outdated dependencies.

## Installation

```sh
yarn plugin import https://mskelton.dev/yarn-outdated/v2
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

| Definition         | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `-a`, `--all`      | Include outdated dependencies from all workspaces.       |
| `-c`, `--check`    | Return exit code 1 if outdated dependencies are found.   |
| `-s`, `--severity` | Filter results based on the severity of the update.      |
| `-t`, `--type`     | Filter results based on the dependency type.             |
| `--url`            | Include the homepage URL of each package in the output.  |
| `--json`           | Output in JSON format instead of in the formatted table. |

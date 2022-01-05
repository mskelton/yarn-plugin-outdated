# Yarn Plugin Outdated

Yarn plugin to show outdated dependencies.

![screenshot](https://user-images.githubusercontent.com/25914066/148265983-aa3c88d4-6b94-4289-ab28-926a0b32741c.png)

## Installation

### Yarn 3

```sh
yarn plugin import https://mskelton.dev/yarn-outdated/v2
```

### Yarn 2

```sh
yarn plugin import https://mskelton.dev/yarn-outdated/v1.2.0
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

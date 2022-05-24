# Yarn Plugin Outdated

Yarn plugin to show outdated dependencies.

![screenshot](https://user-images.githubusercontent.com/25914066/148265983-aa3c88d4-6b94-4289-ab28-926a0b32741c.png)

## Installation

### Yarn 3

```sh
yarn plugin import https://mskelton.dev/yarn-outdated/v3
```

### Yarn 2

```sh
yarn plugin import https://mskelton.dev/yarn-outdated/v1.2.0
```

## Usage

When run without arguments, this plugin will find outdated plugins in all workspaces of your project.

```sh
yarn outdated
```

### Filter by dependency

You can easily filter dependencies using any valid [micromatch](https://github.com/micromatch/micromatch) glob pattern. This is especially useful when you want to check a set of related dependencies such as a component library or tools such as Babel or ESLint.

```sh
yarn outdated '@babel/*'
```

And, in case you were wondering, you can add multiple glob patterns!

```sh
yarn outdated '@babel/*' '@types/*'
```

### Filter by workspace (`--workspace`, `-w`)

In addition to filtering dependencies, larger projects will find it very helpful to filter workspaces so only outdated dependencies in a set of workspaces will be included.

The simplest way to filter a workspace is by it's name. And just like dependency filtering, this flag supports glob patterns!

```sh
yarn outdated --workspace frontend
```

You can also filter workspaces by directory using either an absolute or relative path.

```sh
yarn outdated --workspace packages/a
yarn outdated --workspace /Users/mark/project/packages/a
```

The `--workspace` flag can be added multiple times to specify multiple glob patterns to match with. You can even mix and match directories and workspace names!

```sh
yarn outdated --workspace packages/a --workspace frontend
```

_Tip: Specifying `--workspace .` will use the current working directory._

### Filter by severity (`--severity`, `-s`)

It's not always possible to update to the latest major version, and likewise you may not care about every single patch release to packages. Don't worry, we've got your back! With the `--severity` option, you can specify which severity levels to include. By default, we show all but if you only want to display minor versions updates, you could use this command.

```sh
yarn outdated --severity minor
```

Also, this flag can be specified multiple times if you would like to include multiple severities, such as minor and patch versions, as shown in the following example.

```sh
yarn outdated --severity minor --severity patch
```

### Filter by type (`--type`, `-t`)

The final means of filtering outdated dependencies is by dependency type. For example, to only display outdated `devDependencies`, use the following command.

```sh
yarn outdated --type devDependencies
```

### Check mode (`--check`, `-c`)

By default, this plugin will always return an exit code 0 even if there are outdated dependencies. While this is perfect for normal use, if you want to use this plugin with scripts and fail if there are outdated dependencies, you can add the `--check` flag.

```sh
yarn outdated --check
```

### Display URL (`--url`)

It is possible to display dependency homepage URLs in the output. To do so, simply add the `--url` flag to the command!

```sh
yarn outdated --url
```

### JSON output (`--json`)

If you are writing a script that depends on information from this plugin, you may find the `--json` option helpful to get more raw data that you can then parse and use as your needs require.

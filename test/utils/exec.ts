import { npath, PortablePath } from "@yarnpkg/fslib"
import cp from "node:child_process"

interface Options {
  cwd: PortablePath
  env?: Record<string, string>
}

type Output = Record<"stdout" | "stderr", string>

type ExecResult = Output & {
  code?: string | number | null
}

export const execFile = (
  path: string,
  args: string[],
  { cwd, env }: Options
): Promise<ExecResult> => {
  return new Promise((resolve) => {
    cp.execFile(
      path,
      args,
      { cwd: npath.fromPortablePath(cwd), env },
      (error, stdout, stderr) => {
        if (stdout.length > 0 && !stdout.endsWith("\n"))
          stdout += "<no line return>\n"

        if (stderr.length > 0 && !stderr.endsWith("\n"))
          stderr += "<no line return>\n"

        if (error) {
          error.message += `\n===== stdout:\n${stdout}`
          error.message += `\n===== stderr:\n${stderr}`
        }

        if (error) {
          resolve({ code: error.code, stderr, stdout })
        } else {
          resolve({ code: 0, stderr, stdout })
        }
      }
    )
  })
}

import { npath, PortablePath } from "@yarnpkg/fslib"
import * as cp from "child_process"

interface Options {
  cwd: PortablePath
  env?: Record<string, string>
}

type Output = Record<"stdout" | "stderr", string>

export type ExecSuccess = Output & { code: 0 }
export type ExecFailure = cp.ExecException & Output
export type ExecResult = ExecSuccess | ExecFailure

export const execFile = (
  path: string,
  args: string[],
  { cwd, env }: Options
): Promise<ExecResult> => {
  console.log(cwd)
  return new Promise((resolve, reject) => {
    cp.execFile(
      path,
      args,
      { cwd: npath.fromPortablePath(cwd), env },
      (error, stdout, stderr) => {
        if (stdout.length > 0 && !stdout.endsWith(`\n`))
          stdout += `<no line return>\n`

        if (stderr.length > 0 && !stderr.endsWith(`\n`))
          stderr += `<no line return>\n`

        if (error) {
          reject(Object.assign(error, { stderr, stdout }))
        } else {
          resolve({ code: 0, stderr, stdout })
        }
      }
    )
  })
}
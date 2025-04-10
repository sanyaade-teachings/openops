import { logger } from '@openops/server-shared';
import { ChildProcess } from 'child_process';
import { execFile, spawn } from 'node:child_process';

export interface CommandResult {
  stdOut: string;
  stdError: string;
  exitCode: number;
}

export async function executeCommand(
  command: string,
  args: string[],
): Promise<CommandResult> {
  const fullCommand = `${command} ${args.join(' ')}`;
  logger.debug('Execute command', { command: fullCommand });

  const childProcess = spawn(command, args);

  return await getResult(childProcess, fullCommand);
}

export async function executeFile(
  file: string,
  args: string[],
  envVariables: any,
): Promise<CommandResult> {
  const childProcess = execFile(file, args, { env: envVariables });

  return await getResult(childProcess, file);
}

async function getResult(childProcess: ChildProcess, fullCommand: string) {
  let stdout = '';
  let error = '';

  childProcess.stderr?.on('data', function (data) {
    error += data;
  });

  childProcess.stdout?.on('data', (data) => {
    stdout += data;
  });

  const exitCode = await new Promise<number>((resolve) => {
    childProcess.on('close', (code: number) => {
      resolve(code);
    });
  });

  logger.debug('Command exited', {
    command: fullCommand,
    exitCode,
    stdout,
    error,
  });

  return {
    exitCode: exitCode,
    stdOut: trimNewLines(stdout),
    stdError: trimNewLines(error),
  };
}

function trimNewLines(output: string) {
  return output.replace(/^[\r\n]+|[\r\n]+$/g, '');
}

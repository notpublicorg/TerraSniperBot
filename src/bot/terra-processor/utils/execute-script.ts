import { exec } from 'child_process';

export const executeScript = (script: string) =>
  new Promise<string>((resolve, reject) =>
    exec(script, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(stderr);
        return;
      }

      resolve(stdout);
    }),
  );

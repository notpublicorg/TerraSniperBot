import { ChildProcess, fork } from 'child_process';
import express from 'express';

const app = express();
const port = 3000;

class ChildController {
  private path = __dirname + '/test.js';
  private child: ChildProcess | null = null;

  start() {
    this.child = fork(this.path);
    this.child.on('close', (code, signal) => {
      // child process exited with code null signal SIGTERM
      console.log('child process exited with code ' + code + ' signal ' + signal);
      this.child = null;
    });
  }
  stop() {
    this.child?.kill();
  }
}

const childController = new ChildController();

app.get('/start', (_, res) => {
  childController.start();
  res.send('Starting');
});
app.get('/stop', (_, res) => {
  childController.stop();
  res.send('Stopping');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// Enable graceful stop
function gracefulStop() {
  childController.stop();
}

process.once('SIGINT', gracefulStop);
process.once('SIGTERM', gracefulStop);

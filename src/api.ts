import { ChildProcess, fork } from 'child_process';
import cors from 'cors';
import express from 'express';

class BotProcessController {
  private path = __dirname + '/bot/index.js';
  private child: ChildProcess | null = null;

  start() {
    this.child = fork(this.path);
    this.child.on('close', (_, signal) => {
      console.log('child process exited with signal ' + signal);
      this.child = null;
    });
  }
  stop() {
    this.child?.kill();
  }
}

const bot = new BotProcessController();
const port = 3000;

const app = express();
app.use(cors());

app.get('/start', (_, res) => {
  bot.start();
  res.send('Starting');
});
app.get('/stop', (_, res) => {
  bot.stop();
  res.send('Stopping');
});

const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Enable graceful stop
function gracefulStop() {
  bot.stop();
  server.close();
}

process.once('SIGINT', gracefulStop);
process.once('SIGTERM', gracefulStop);

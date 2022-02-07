import { exec } from 'child_process';
import cors from 'cors';
import express from 'express';

const APPS_FILE = 'ecosystem.config.js';

const botController = {
  start: () => exec(`pm2 start ${APPS_FILE}`),
  stop: () => exec(`pm2 delete ${APPS_FILE}`),
};

const port = 3000;

const app = express();
app.use(cors());

app.get('/start', (_, res) => {
  botController.start();
  res.send('Starting');
});
app.get('/stop', (_, res) => {
  botController.stop();
  res.send('Stopping');
});

const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Enable graceful stop
function gracefulStop() {
  botController.stop();
  server.close();
}

process.once('SIGINT', gracefulStop);
process.once('SIGTERM', gracefulStop);

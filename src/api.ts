import { exec } from 'child_process';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';

const APPS_FILE_PATH = 'ecosystem.config.js';
const CONFIG_FILE_PATH = 'config.json';

const botController = {
  start: () => exec(`pm2 start ${APPS_FILE_PATH}`),
  stop: () => exec(`pm2 stop ${APPS_FILE_PATH}`),
  restart: () => exec(`pm2 restart ${APPS_FILE_PATH}`),
  getConfig: async () => {
    const result = await fs.readFile(CONFIG_FILE_PATH);
    return JSON.parse(result.toString());
  },
  setConfig: async (config: Record<string, unknown>) => {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config));
  },
};

const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/start', (_, res) => {
  botController.start();
  res.send('Starting');
});
app.get('/stop', (_, res) => {
  botController.stop();
  res.send('Stopping');
});
app.get('/restart', (_, res) => {
  botController.restart();
  res.send('Restarting');
});
app.get('/config', async (_, res) => {
  const config = await botController.getConfig();
  res.json(config);
});
app.post('/config', async (req, res) => {
  await botController.setConfig(req.body);
  res.send('Success');
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

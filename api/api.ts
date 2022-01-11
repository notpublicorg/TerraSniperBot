import { fork } from 'child_process';
import express from 'express';

const app = express();
const port = 3000;

app.get('/start', (_, res) => {
  fork(__dirname + '/test.js');
  res.send('Starting');
});
app.get('/stop', (_, res) => {
  res.send('Stopping');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

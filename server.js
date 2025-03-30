const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve your frontend (from public folder)
app.use(express.static('public'));

wss.on('connection', function connection(ws) {
  console.log('🖥️ New terminal session started');

  // Replace with your actual EC2 IP
  const ec2IP = '3.82.194.92';

  const shell = pty.spawn('ssh', [
    '-i', path.join(__dirname, 'SQL-KEY.pem'),
    `ec2-user@${ec2IP}`
  ], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  let initialized = false;

  shell.on('data', function (data) {
    // Inject mysql only once when SSH is ready
    if (!initialized && data.includes('ec2-user@')) {
      initialized = true;
      shell.write('mysql\n'); // .my.cnf will log in automatically
    }

    ws.send(data);
  });

  ws.on('message', function (msg) {
    shell.write(msg);
  });

  ws.on('close', function () {
    shell.kill();
    console.log('❌ Terminal session closed');
  });
});

server.listen(3000, () => {
  console.log('🚀 Server + WebSocket running at http://localhost:3000');
});
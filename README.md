# AWS MySQL Server Setup Documentation

## Project Goal
Build a web-based AWS EC2 instance using SSH, and allows users to interact with the database through a simulated shell in the browser.

---

## ☁️ AWS EC2 Instance Setup

### 1. Launch EC2 Instance
- Go to [AWS Console](https://console.aws.amazon.com/)
- Launch a new instance with:
  - **AMI**: Ubuntu 22.04 LTS
  - **Instance type**: t2.micro (Free tier)
  - **Key pair**: Create and download a `.pem` file (e.g. `SQL-KEY.pem`)
  - **Security group**: Allow TCP for SSH (port 22) and any custom port if needed (e.g. 3000)

### 2. Connect to Instance
```bash
ssh -i ~/.ssh/SQL-KEY.pem ubuntu@your-ec2-public-ip
```
or
```bash
ssh -i ~/.ssh/SQL-KEY.pem ec2-user@your-ec2-public-ip
```
If using an ec2 instance

### 3. Install MySQL Server
```bash
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 4. Configure MySQL Credentials
Create a `.my.cnf` in the home directory for passwordless CLI login:
```ini
[client]
user=root
password=your_mysql_password
```
```bash
chmod 600 ~/.my.cnf
```
Test it:
```bash
mysql
```

---

## Web Terminal App Setup

### 1. Project Structure
```
server_project/
├── server.js
├── SQL-KEY.pem
├── .env
└── public/
    └── index.html
```

### 2. Backend Setup (Node.js)
Install dependencies:
```bash
npm install express ws node-pty xterm dotenv
```

#### `server.js`
```js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', function (ws) {
  const shell = pty.spawn('ssh', [
    '-i', path.join(__dirname, 'SQL-KEY.pem'),
    `ubuntu@${process.env.EC2_HOST}`
  ], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  let initialized = false;
  shell.on('data', function (data) {
    if (!initialized && data.includes('ubuntu@')) {
      shell.write('mysql\n');
      initialized = true;
    }
    ws.send(data);
  });

  ws.on('message', function (msg) {
    shell.write(msg);
  });

  ws.on('close', function () {
    shell.kill();
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

#### `.env`
```
EC2_HOST=your-ec2-public-ip
```

---

## Frontend Terminal (HTML + xterm.js)

`public/index.html` provides the terminal UI with a fake loader and instructions.
(See full HTML in the canvas)

---

## Troubleshooting

### SSH Key Errors
```
Permissions 0777 for 'SQL-KEY.pem' are too open
```
**Fix**:
```bash
chmod 600 ~/.ssh/SQL-KEY.pem
```

### GitHub SSH Issues
```
Permission denied (publickey)
```
**Fix**:
- Make sure your key is in `~/.ssh`
- Use `ssh-add ~/.ssh/id_ed25519`
- Add public key to GitHub → Settings → SSH Keys

### MySQL Login Issues
```
ERROR 1045 (28000): Access denied
```
**Fix**:
- Use `.my.cnf` file for root login
- Make sure `mysql` user has correct password and permissions

---

## Conclusion
This project provided hands-on experience with:
- AWS EC2 provisioning and secure access
- MySQL server installation and authentication
- SSH key handling and WSL integration
- Building a browser-based terminal using `xterm.js` and `node-pty`
- Real-time SSH and MySQL interaction in a web environment

### Takeaways
- SSH keys must be stored securely and with correct permissions
- WSL has its own filesystem and permission rules
- Browser terminals open up powerful real-time tools for database or server interactions

This knowledge can be applied to building cloud dashboards, devops admin tools, or full-stack cloud-native environments.

---

Happy coding! 🧑‍💻🚀

# AWS MySQL Terminal Project Setup Documentation

## Project Goal
Build a MySQL database running on an AWS EC2 instance using SSH.  

#### Extra: 
Allow users to interact with the database through a simulated shell in the browser.

---

## AWS EC2 Instance Setup

### 1. Launch EC2 Instance
- Go to [AWS Console](https://console.aws.amazon.com/)
- Launch a new instance with:
  - **AMI**: Ubuntu 22.04 LTS
  - **Instance type**: t2.micro (Free tier)
  - **Key pair**: Create and download a `.pem` file (e.g. `SQL-KEY.pem`)
  - **Security group**: Allow TCP for SSH (port 22) from 0.0.0.0/0 (or your IP for more security). 

### 2. Connect to Instance

Depending on the AMI (Amazon Machine Image) you're using, the default username might differ. For Ubuntu-based instances, it's typically `ubuntu`. For Amazon Linux, it's usually `ec2-user`.

**Example for Ubuntu:**
```bash
ssh -i ~/.ssh/SQL-KEY.pem ubuntu@your-ec2-public-ip
```

**Example for Amazon Linux:**
```bash
ssh -i ~/.ssh/SQL-KEY.pem ec2-user@your-ec2-public-ip
```

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

## SSH Key Creation and Usage

### 1. Generate a new SSH key (if needed)
In your terminal:
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```
Press Enter through the prompts to save it at the default path (`~/.ssh/id_ed25519`).

### 2. View your public key
```bash
cat ~/.ssh/id_ed25519.pub
```
Copy the entire output.

### 3. Add SSH key to GitHub
1. Go to GitHub → Settings → SSH and GPG keys → New SSH key
2. Paste the public key
3. Give it a name

### 4. Set permissions for private key
```bash
chmod 600 ~/.ssh/id_ed25519
```
This command sets the permissions on your private key so that **only your user account can read and write to it**. SSH requires private keys to be secure. If they are accessible by other users, SSH will refuse to use them. `600` means:
- `6` (read + write) for the file owner
- `0` (no permissions) for group
- `0` (no permissions) for others

### 5. Add your key to the SSH agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 6. Test your connection to GitHub
```bash
ssh -T git@github.com
```
You should see:
```
Hi your-username! You've successfully authenticated...
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
    cwd: process.env.WORKING_DIR || process.env.HOME,
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
The `.env` file is used to store environment-specific configuration values outside of your codebase. This keeps sensitive data like API keys or server IPs secure and allows for easy configuration changes without modifying the code.

Example contents:
```
# IP address or DNS name of your EC2 instance
EC2_HOST=your-ec2-public-ip

# Optional: MySQL credentials if you plan to pass them through env
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password

# Optional: Specify working directory for the shell (defaults to HOME if not set)
WORKING_DIR=/home/ubuntu
```

> ⚠ Make sure to add `.env` to your `.gitignore` file to prevent sensitive data from being committed to version control.

---

## 🌐 Frontend Terminal (HTML + xterm.js)

`public/index.html` provides the terminal UI with a fake loader and instructions.
(See full HTML in the canvas)

---

## 🛠️ Troubleshooting

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
- MySQL is such a cool technology to utilize when storing large datasets

---

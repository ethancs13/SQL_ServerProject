const path = require('path');
const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

// Set the path to SQL-KEY.pem in the same directory as server.js
const keyPath = path.join(__dirname, 'SQL-KEY.pem');

app.get('/connect', (req, res) => {
    const conn = new Client();

    conn.on('ready', () => {
        console.log('SSH Connection Established');
        console.log('Connecting with:', {
            host: '3.82.194.92',
            username: 'ec2-user',
            key: keyPath
          });          
        const mysqlCommand = `mysql -u root -p'${process.env.MYSQL_PASSWORD}' -e "SHOW DATABASES;"`;

        conn.exec(mysqlCommand, (err, stream) => {
            if (err) {
                res.send(err);
                return;
            }
            let data = '';
            stream.on('data', (chunk) => (data += chunk));
            stream.on('close', () => {
                conn.end();
                res.send(data);
            });
        });
    }).connect({
        host: '3.82.194.92',
        port: 22,
        username: 'ec2-user',
        privateKey: require('fs').readFileSync(keyPath)
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));

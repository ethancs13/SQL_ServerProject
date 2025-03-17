const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/connect', (req, res) => {
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.exec('mysql -u root -p -e "SHOW DATABASES;"', (err, stream) => {
            if (err) res.send(err);
            let data = '';
            stream.on('data', (chunk) => data += chunk);
            stream.on('close', () => {
                conn.end();
                res.send(data);
            });
        });
    }).connect({
        host: '3.82.194.92',
        port: 22,
        username: 'root',
        privateKey: require('fs').readFileSync('/home/ethan/.ssh/SQL-KEY.pem')
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

wss.on('connection', (ws) => {
    console.log('Conectado');
    esp32Socket = ws;

    // Mantener la conexión activa enviando PING cada 20 segundos
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, 20000);

    ws.on('close', () => {
        console.log('Servidor desconectado');
        clearInterval(interval);
        esp32Socket = null;
    });

    ws.on('error', (err) => {
        console.error('Error en WebSocket:', err);
    });
});

app.get('*', (req, res) => {
    if (!esp32Socket || esp32Socket.readyState !== 1) {
        return res.status(503).send('El servidor no esta disponible por el momento. -Danny');
    }
    
    esp32Socket.send('GET_DATA');
    
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).send('Tiempo de espera agotado');
        }
    }, 10000);

    esp32Socket.once('message', (message) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
            res.send(message.toString());
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Servidor corriendo en el puerto ' + PORT);
});

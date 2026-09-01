const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

// Conexión WebSocket desde el ESP32
wss.on('connection', (ws) => {
    console.log('ESP32-S3 conectado al túnel!');
    esp32Socket = ws;

    ws.on('close', () => {
        console.log('ESP32-S3 desconectado');
        esp32Socket = null;
    });
});

// Ruta pública que verán tus usuarios en HTTPS
app.get('*', (req, res) => {
    if (!esp32Socket) {
        return res.status(503).send('El ESP32-S3 no está conectado al túnel en este momento.');
    }
    
    // Enviar petición al ESP32 y esperar respuesta
    esp32Socket.send('GET_DATA');
    
    esp32Socket.once('message', (message) => {
        res.send(message.toString());
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Servidor puente corriendo en el puerto ' + PORT);
});

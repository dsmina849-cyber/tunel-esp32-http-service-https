const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

wss.on('connection', (ws) => {
    console.log('ESP32 Conectado');
    esp32Socket = ws;

    // Mantener la conexión activa enviando PING cada 20 segundos
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, 20000);

    ws.on('close', () => {
        console.log('ESP32 Desconectado');
        clearInterval(interval);
        esp32Socket = null;
    });

    ws.on('error', (err) => {
        console.error('Error en WebSocket ESP32:', err);
    });
});

app.get('*', (req, res) => {
    if (!esp32Socket || esp32Socket.readyState !== 1) {
        return res.status(503).send('El servidor no está disponible por el momento. -Danny');
    }

    // Reenvía el método y la URL exacta solicitada por el navegador (ej: "GET /bans" o "GET /")
    const solicitud = `${req.method} ${req.url}`;
    
    // Función escuchadora exclusiva para la respuesta de esta petición
    const manejarRespuesta = (message) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(message.toString());
        }
    };

    // Registrar escuchador temporal
    esp32Socket.once('message', manejarRespuesta);

    // Timeout de seguridad en caso de que el ESP32 no responda
    const timeout = setTimeout(() => {
        if (esp32Socket) {
            esp32Socket.removeListener('message', manejarRespuesta);
        }
        if (!res.headersSent) {
            res.status(504).send('Tiempo de espera agotado');
        }
    }, 10000);

    // Enviar solicitud al ESP32
    esp32Socket.send(solicitud);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Servidor proxy corriendo en el puerto ' + PORT);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sql = require('mssql');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

// Crear servidor HTTP con express
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // permite cualquier origen, ajusta si quieres seguridad
    methods: ["GET", "POST"]
  }
});

// Rutas existentes
const rutas = require('./routes/flutter/sesionf');
const chat = require('./routes/flutter/chat');
const apiPython = require('./routes/python/PythonApi');
const aspapi = require('./routes/AspApi');

app.use('/', rutas);
app.use('/', chat);
app.use('/', apiPython);
app.use('/', aspapi);

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('joinRoom', (idChat) => {
    const roomName = `chat_${idChat}`;
    socket.join(roomName);
    console.log(`Usuario ${socket.id} se unió a la sala: ${roomName}`);
    
    // Mostrar todas las salas actuales (para depuración)
    console.log('Salas activas actualmente:', io.sockets.adapter.rooms);
  });

  socket.on('sendMessage', async (data) => {
    console.log('Mensaje recibido por socket:', data);

    // Emitir solo a los usuarios que están en la sala del chat
    const roomName = `chat_${data.idChat}`;
    io.to(roomName).emit('newMessage', data);
    
    console.log(`Mensaje enviado a la sala: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});


// Arrancar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

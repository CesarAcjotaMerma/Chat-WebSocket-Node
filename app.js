const express = require("express");
const path = require('path');
const app = express();

//setting PORT
app.set('port', process.env.PORT || 3000);

app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(app.get('port'), () => {
  console.log('Servidor iniciando en', app.get('port'));
});

//Websockets
const SocketIO = require("socket.io");
const io = SocketIO(server);

const rooms = {}
io.on('connection', socket => {
  socket.on('join room', ({id, username, roomName}) => {
    socket.join(roomName)
    saveDataRoom(id, username, roomName)
    io.sockets.in(roomName).emit('user joined', {roomName, users: getUsersFromRoom(roomName)})
  });

  socket.on('message', message => {
    const { roomName, username }= searchInfoBySocketId(socket.id)
    io.sockets.in(roomName).emit('message', { message, username })
  });

  socket.on('disconnect', () => {
    const { roomName } = searchInfoBySocketId(socket.id)
    deleteUserFromRoom(socket.id, roomName)
    io.sockets.in(roomName).emit('user disconnect', { roomName, users: getUsersFromRoom(roomName) })
  });
});

function saveDataRoom(id, username, roomName) {
  let room = rooms[roomName]
  if(!room) {
    room = rooms[roomName] = {}
  }
  room[id] = username
}

function getUsersFromRoom(roomName) {
  if(rooms[roomName]) {
    return Object.values(rooms[roomName])
  }

  return []
}

function searchInfoBySocketId(socketId) {
  for(const roomName in rooms) {
    const existInRoom = socketId in rooms[roomName]
    if(existInRoom) {
      return { roomName, username: rooms[roomName][socketId] }
    }
  }

  return { roomName: null, username: null }
}

function deleteUserFromRoom(socketId, roomName) {
  if(roomName && socketId in rooms[roomName]) {
    delete rooms[roomName][socketId]
  }
}
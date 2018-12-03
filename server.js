var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Filter = require('bad-words'),
    filter = new Filter();

var sanitizer = require('sanitizer')
var sanitize = require('sanitize');

app.use(sanitize.middleware);
app.use(express.static(__dirname + '/public'));

const usersMap = new Map();

io.on('connection', (socket) => {
  const { id } = socket;

  usersMap.set(id);

  socket.on('disconnect', () => {
    usersMap.delete(id);
  });
  socket.on('reconnect', () => {
    usersMap.set(id, { id });
  });

  socket.on('movement', (data) => {
    socket.broadcast.emit('heard-movement', {...data, id});
  });
  socket.on('user-joined', (data) => {
    const username = sanitizer.sanitize(data.username).substring(0, 14);

    if (username) {
      socket.broadcast.emit('heard-username', {
        username: filter.clean(username),
        totalPlayers: usersMap.size
      });
    }

  });
});

server.listen(process.env.PORT || 3000);
window.addEventListener('DOMContentLoaded', () => {
  console.log('Client-side js running');
  var socket = io();

  // To send something to the server just do this
  //socket.emit('chat message', 'test');

  socket.on('data', msg => {
    document.getElementById('info').innerHTML += `<li>${msg}</li>`;
  });
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Client-side js running');
  const socket = io();
  const proposeTimes = [];

  // To send something to the server just do this
  //socket.emit('chat message', 'test');

  socket.on('data', msg => {
    document.getElementById('info').innerHTML += `<li>Propose time: ${msg}</li>`;
    proposeTimes.push(msg)
    updateGraph();
  });

  function updateGraph() {
    // Test out a graph
    var data = {
      // x data is optional, Integers are assumed :)
      //x: [1, 2, 3, 4],
      y: proposeTimes,
      type: 'scatter',
      name: "Propose Times"
    }
    Plotly.newPlot('graph', [data])
  }
});

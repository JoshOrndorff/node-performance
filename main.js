const { RNode, RHOCore } = require('rchain-api');
const docopt = require('docopt').docopt;
const grpc = require('grpc');
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
var io = require('socket.io')(http);

const usage = `

Repeatedly deploys @Nil!(Nil) and proposes blocks with specified cooldown periods.

Usage:
  main.js [options]

Options:
 --host INT                The hostname or IPv4 address of the node
                           [default: localhost]
 --port INT                The tcp port of the nodes gRPC service
                           [default: 40401]
 --term STRING             The rholang file to deploy
                           [default: basicSend.rho]
 -d --deploy-cooldown INT  Seconds to wait after deploy completion
                           [default: 0]
 -p --propose-cooldown INT Seconds to wait after propose completion
                           [default: 0]
 -n --iterations INT       Number of times to deploy and propose
                           [default: 10]
 -h --help                 show usage

`;
const cli = docopt(usage, { argv: process.argv.slice(2) });
console.log('DEBUG: cli:', cli);

// Initialize globals ()@dckc will hate this)
const myNode = RNode(grpc, { host: cli["--host"], port: cli["--port"] });
const clock = () => (new Date()).valueOf();
const deployCooldown = cli["--deploy-cooldown"];
const proposeCooldown = cli["--propose-cooldown"];
const term = fs.readFileSync(cli['--term'])

// Start the actual deployments
deployPropose(term, cli["--iterations"]);

// Setup a path
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Serve static assets like index.html and page.js from root directory
app.use(express.static(__dirname));

io.on('connection', function(socket){
  console.log('a user connected.');
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});



/**
 * Deploys a term and proposes a block with appropriate
 * cooldown periods in between.
 */
function deployPropose(term, count){
  const deployData = {
    term,
    timestamp: clock(),
    phloPrice: { value: 1 },
    phloLimit: { value: 10000000 },
    from: "0x01",
  }

  let start = clock();
  let deployDone;
  let proposeStart;
  let proposeDone;

  myNode.doDeploy(deployData, false)
    .then(_ => {
      deployDone = clock();
      return new Promise(resolve => setTimeout(resolve, deployCooldown * 1000));
    })
    .then(_ => {
      proposeStart = clock();
      return myNode.createBlock();
    })
    .then(_ => {
      proposeDone = clock();

      let deployTime = deployDone - start;
      let proposeTime = proposeDone - proposeStart;
      console.log(`Deploy: ${deployTime} Propose: ${proposeTime}`);
      io.emit('data', proposeTime);

      return new Promise(resolve => setTimeout(resolve, proposeCooldown * 1000));
    })
    .then(_ => {
      if (count > 0){
        deployPropose(term, count - 1)
      }
    })

}

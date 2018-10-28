const { RNode, RHOCore } = require('rchain-api');
const docopt = require('docopt').docopt;
const grpc = require('grpc');
const fs = require('fs');

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

const myNode = RNode(grpc, { host: cli["--host"], port: cli["--port"] });

const clock = () => (new Date()).valueOf();
const deployCooldown = cli["--deploy-cooldown"];
const proposeCooldown = cli["--propose-cooldown"];
const term = fs.readFileSync(cli['--term'])

deployPropose(cli["--iterations"]);






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
      console.log(`Deploy Time: ${deployDone - start}. Propose Time: ${proposeDone - proposeStart}`);
      return new Promise(resolve => setTimeout(resolve, proposeCooldown * 1000));
    })
    .then(_ => {
      if (count > 0){
        deployPropose(term, count - 1)
      }
    })

}

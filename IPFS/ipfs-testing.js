const IPFS = require('ipfs')

const { CID } = require('multiformats/cid')

const all = require('it-all')

const uint8arrays =  require('uint8arrays');

const { multiaddr } = require("ipfs");

const ipfs_http = require('ipfs-http-client');

initializationTesting = async () =>{

    /*
    var ipfs = await IPFS.create({
                //repo: 'ipfs-' + Math.random(),
    });*/

    var ipfs = await ipfs_http.create()

    console.log(JSON.stringify(await ipfs.config.getAll(), null , 4))

    console.log(await ipfs.id());

    var hello = await ipfs.add('Hello World! CryptoSteve 9999')

    console.log(hello.cid.toString())
    
    setInterval(async () => {
        try{
            var peers = await ipfs.swarm.peers();

            console.log(`number of peers: ${peers.length}`)

            console.log("reading data...")
            
            var data = uint8arrays.concat(await all(ipfs.cat(CID.parse('Qmdk7qwtKbdSb7UE7d1gWbn4Hi9QpsDxqCgqcwxtrUs7kp'))))

            console.log(`data : ${data}`)

            var hello =  new TextDecoder().decode(data).toString();

            console.log(`read data: ${hello}`)
            
        }catch(err){ console.log(err)}
    }, 10000);

    //process.exit(1);
}

initializationTesting();
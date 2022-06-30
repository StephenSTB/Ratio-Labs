const https = require("https");

const http = require('http')

// Express Declarations / Initialization
const express = require('express');

const cors = require('cors');

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const busboy = require('connect-busboy');

const app = express();

/*
var whitelist = ['http://localhost/3000', 'http://example2.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}*/

//app.use(cors(corsOptions));
app.use(cors())
app.use(express.json());
app.use(limiter);
app.use(busboy(
    {
        highWaterMark: 2 * 1024 * 1024,
        limits : {
            files: 5,
            fileSize: 100 * 1024 * 1024
        }
    }
));

const routes = require('./gateRoutes.js');

const gateVerify = require('./gateVerify')

// MongoDB Declaration/ Initialization
var mongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27018/nftgatedb";

var db;

// Web3 Declarations / Initialization
const Web3 = require('web3');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const networkData = require('../../../src/data/Network_Data.json');

const providers = require('../../../src/data/Providers.json');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

var provider = null;

var web3 = null;

const contract = require('@truffle/contract');

const NFTProtocol = contract(require('../../../src/contracts/NFTProtocol.json'));

var nftProtocol;

var ipfs;

var drop = true;

mongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, async (err, client) =>{
    if (err) throw err;
    //console.log("Database created!");
    db = await client.db("nftgatedb");

    await dbinit();

    await web3init();

    await ipfsinit()
    
    gateVerify(db, ipfs, nftProtocol);

    routes(app, db, ipfs, web3)
    
    https.createServer({
        key: fs.readFileSync("./sslcert/key.pem"),
        cert: fs.readFileSync("./sslcert/cert.pem"),
      },
      app).listen(3001, () =>{
        console.log('server is runing at port 3001')
    })

    http.createServer(app).listen(3002, ()=>{
        console.log('server is runing at port 3002')
    })
    
  });

  dbinit= async () =>{
    if(drop){
        try{
            await db.collection("nft").drop()
        }
        catch{
            console.log("couldn't DROP nft collection");
        }
    }

    try{
        await db.createCollection("nft");
    }
    catch{
        console.log("couldn't CREATE nft collection");
    } 
}

ipfsinit = async () =>{

    // IPFS
    const IPFS = await import("ipfs");
 
    ipfs_http = await import('ipfs-http-client');

    ipfs = await ipfs_http.create('/ip4/127.0.0.1/tcp/5001');

    var pins = await ipfs.pin.ls();

    console.log(`IPFS Pins:`)

    for await (var p of pins){
        console.log(p)
    }
    if(drop){
        try{
            //var dropedPins = await ipfs.pin.rmAll(pins);
            console.log(`Dropping pins`)
            pins = await ipfs.pin.ls();
            for await(var p of pins){
                console.log(p)
                await ipfs.pin.rm(p.cid)
                //console.log(p)
            }
        }catch{
            console.log("Removing pins failed.");
        }
    }

    var id = await ipfs.id(); 

    console.log(`IPFS ID: `)

    console.log(id.addresses[0])
}


web3init = async () =>{
    var args = process.argv.splice(2);
    console.log(`Provider name: ${args[0]}`);
    providerName = args[0];
    try{
        switch(args[0]){
            case 'Ganache':
                provider = new Web3.providers.WebsocketProvider(providers[args[0]].url)
                break;
            case 'Mumbai':
                provider = new Web3.providers.WebsocketProvider(providers[args[0]].url);
                break;
            default:
                console.log("Invalid deployment network given,");
        }
    }catch(err){
        console.log(err);
    }

    try{
        if(provider === null){
            console.log("Invalid provider given.");
            process.exit(1);
        }
    }catch(err){
        console.log(err);
    }
    
    web3 = new Web3(provider);

    await NFTProtocol.setProvider(provider);

    var chainId = await web3.eth.getChainId();

    console.log(chainId)

    var providerName = networkData[chainId].chainName;

    nftProtocol = await NFTProtocol.at(deployedContracts[providerName].NFTProtocol.address);

    console.log(`NFTProtocol Address: ${deployedContracts[providerName].NFTProtocol.address}`)

}





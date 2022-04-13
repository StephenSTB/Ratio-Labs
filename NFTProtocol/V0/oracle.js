// Express Declarations / Initialization
const express = require('express');

const cors = require('cors');

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 25, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const busboy = require('connect-busboy');

const app = express();

app.use(cors());
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

const routes = require('./routes.js');

// MongoDB Declaration/ Initialization
var mongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/nftdb";

// Web3 Declarations / Initialization
const Web3 = require('web3');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../src/data/Providers.json');

var providerName = null;

var provider = null;

var web3 = null;

var accounts = []

const verify = require('./verify')

// IPFS
const IPFS = require("ipfs");
const HDWalletProvider = require('@truffle/hdwallet-provider');

var drop = true;

mongoClient.connect(url, {useUnifiedTopology: true}, async (err, client) =>{
    if (err) throw err;
    //console.log("Database created!");
    const db = client.db("nftdb");

    if(drop){
        try{
            await db.collection("nft").drop()
        }
        catch{
            console.log("couldn't DROP nft collection");
        }
        try{ 
            await db.collection("uri").drop()
        }
        catch{
            console.log("couldn't DROP uri collection");

        }
        try{
            await db.collection("transactions").drop();
        }
        catch{
            console.log("couldn't DROP transactions collection");
        }
    }

    try{
        await db.createCollection("nft");
    }
    catch{
        console.log("couldn't CREATE nft collection");
    } 
    try{
       await db.createCollection("uri");
    }
    catch{
        console.log("couldn't CREATE uri collection");
    }
    try{
       await db.createCollection("transactions");
    }
    catch{
        console.log("couldn't CREATE transactions collection");
    }
    

    await init();

    const ipfs = await IPFS.create();

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
    
    verify(db, provider, providerName, web3, accounts);

    routes(app, db, ipfs, web3)
    
    app.listen(3001);
    
  });


init = async () =>{
    var args = process.argv.splice(2);
    console.log(`Provider name: ${args[0]}`);
    providerName = args[0];
    try{
        switch(args[0]){
            case 'developmentCLI':
                provider = ganache.provider({mnemonic: mnemonic, quiet: true}) //
                break;
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
    var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers[args[0]].url})
    
    for(var w in wallet.wallets){
        //console.log(wallet.wallets[w].privateKey)
        //accounts.push(wallet.wallets[w].publicKey.toString())
        
        web3.eth.accounts.wallet.add("0x"+ wallet.wallets[w].privateKey.toString('hex'))
    }

    //console.log(web3.eth.accounts.wallet)

    //console.log(accounts[4]);
    
}


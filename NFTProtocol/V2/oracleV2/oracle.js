// MongoDB Declaration/ Initialization
var mongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/nftdb";

var db;

// Web3 Declarations / Initialization
const Web3 = require('web3');

const fs = require("fs");

const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../../src/data/Providers.json');

var provider = null;

var web3 = null;

const core = require('./core.js');

var ipfs;

// Drop collections and pins
var drop = true;

// Variable to hold command arguments.
var args;

mongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, async (err, client) =>{
    if (err) throw err;
    //console.log("Database created!");
    db = await client.db("nftdb");
    
    await dbinit();

    await web3init();

    await ipfsinit();
    
    await core(db, web3, ipfs);
    
});

  dbinit= async () =>{
    if(drop){
        try{
            await db.collection("nft").drop()
        }
        catch{
            console.log("couldn't DROP nft collection");
        }
        try{
            await db.collection("transactions").drop();
        }
        catch{
            console.log("couldn't DROP transactions collection");
        }
        try{
            await db.collection("logs").drop();

        }catch{
            console.log("couldn't DROP logs collection");
        }
    }

    try{
        await db.createCollection("nft");
    }
    catch{
        console.log("couldn't CREATE nft collection");
    } 
    try{
       await db.createCollection("transactions");
    }
    catch{
        console.log("couldn't CREATE transactions collection");
    }
    try{
        await db.createCollection("logs");
    }
    catch{
        console.log("couldn't CREATE logs collection");
    }
}

web3init = async () =>{
    args = process.argv.splice(2);
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
    var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers[args[0]].url})
    
    for(var w in wallet.wallets){
        //console.log(wallet.wallets[w].privateKey)
        //accounts.push(wallet.wallets[w].publicKey.toString())
        
        web3.eth.accounts.wallet.add("0x"+ wallet.wallets[w].privateKey.toString('hex'))
    }

    //console.log(web3.eth.accounts.wallet)

    //console.log(accounts[4]);
    
}

ipfsinit = async () =>{
    // IPFS
    const IPFS = await import("ipfs");

    const ipfs_http = await import('ipfs-http-client');

    if(args.includes("HTTP")){
        ipfs = await ipfs_http.create('/ip4/127.0.0.1/tcp/5002/http');//ipfs_http.create('/ip4/127.0.0.1/tcp/5001');
    }
    else{
        ipfs = await IPFS.create();
    }

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






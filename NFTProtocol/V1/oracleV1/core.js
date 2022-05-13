const contract = require('@truffle/contract');

const { MerkleTree } = require('merkletreejs')

const {CID} = require('ipfs');

const all = require("it-all");

const uint8arrays = require('uint8arrays');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const keccak256 = require('keccak256');

const NFTProtocol = contract(require('../../../src/contracts/NFTProtocol.json'));

var nftProtocol;

const path = require('path');  
const fs = require("fs-extra");

const {sync: mime_kind} = require('mime-kind');
const { Binary } = require('mongodb');

const uploadPath = path.join(__dirname, 'nft/'); // Register the upload path
fs.ensureDir(uploadPath); // Make sure that he upload path exits

var uri_ext = ["jpg", "png", "gif", "svg", "mp3", "wav", "ogg", "mp4", "webm","glb", "gltf"];

core = async (db, web3, ipfs) =>{

    var wallet = web3.eth.accounts.wallet;

    var account = wallet["4"].address;

    //console.log(account)

    var provider = await web3.eth.currentProvider;

    var chainId = await web3.eth.getChainId();

    var providerName = networkData[chainId].chainName;

    console.log(await web3.eth.getChainId())

    await NFTProtocol.setProvider(provider);

    await NFTProtocol.setWallet(web3.eth.accounts.wallet);

    await NFTProtocol.defaults({from: account});

    console.log(`NFTProtocol Address: ${deployedContracts[providerName].NFTProtocol.address}`)

    nftProtocol = await NFTProtocol.at(deployedContracts[providerName].NFTProtocol.address);

    //var owner = await nftProtocol.owner();

    // Function utilized to verify subURIs in an nft.
    validateURIs = async (content, block, baseURI) =>{

        var main = [content.image, content.audio, content.video, content.model] 
        var res = {status: false, subURIs: [], content: {}, slash: [], update: [], insert: []}
        var contract = content.contract;
        var distributor = content.distributor;

       
        var i = 0;
        for(var a of main){
            if(a !== undefined){
                var cid;
                if(a.length !== 53 || a.substring(0,7) !== "ipfs://" || (cid = a.replace("ipfs://", "").split("?filename=")).length != 2){
                    return res;
                }
                try{
                   CID.parse(cid);
                }
                catch{ 
                    return res;
                }
                var data = await db.collection("uri").findOne({uri: a})
                if(data !== null){
                    console.log(`   subURI '${a}' already exits.`)
                    if(data.block <= block){
                        console.log(`       Already validiated.`)
                        await db.collection('nft').updateOne({contract: contract}, {$set: {state: "rejected"}})
                        return res;
                    }
                    console.log(`       ${distributor} is distributor slash: ${data.contract} and update.`)
                    res.slash.push(data.contract);
                    res.update.push({uri: a, contract: contract, distributor: distributor, block: block, baseURI: baseURI});
                }
                else{
                    res.insert.push({uri: a, contract: contract, distributor: distributor, block: block, baseURI: baseURI})
                }
                res.main.push(a)
                
                switch(i){
                    case 0: res.content.image = a; break;
                    case 1: res.content.audio = a; break;
                    case 2: res.content.video = a; break;
                    case 0: res.content.model = a; break;
                }
            }
            i++;
        }
    
        res.status = true;
        return res;
    }

    verifyNFTs = async () =>{
        console.log("Verifying NFTs:")
        var nfts = await db.collection("nft").find({state: "new"}).toArray();

        var currentBlock =  await web3.eth.getBlockNumber();

        var staleBlock = currentBlock - (4 * slot);// 7200 blocks // Original 21600;

        var rejectBlock = currentBlock - (48 * slot);

        //TODO stale-verify

        for(var n of nfts){
            var baseURI = n.baseURI;
            var block = n.block;
            console.log(`   NEW NFT Info: contract: ${n.contract}, distributor: ${n.distributor}, \n                baseURI: ${n.baseURI}, state: ${n.state}, block: ${n.block}`)
            var cid = n.baseURI.replace("ipfs://" , "");
            console.log(`   CID: ${cid}`);

            var nft;
            
            try{
                var data = uint8arrays.concat(await all(ipfs.files.read("/ipfs/" + cid, {length: 100000, timeout: 2000})));

                //console.log(data)

                //console.log(`   Base URI data length: ${data.length}`);

                var decodedData = new TextDecoder().decode(data).toString();

                //console.log(`file content: ${decodedData}`)

                try{
                    nft = JSON.parse(decodedData);
                }
                catch{
                    console.log("   Invalid nft json format.")
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                }
            }catch(err){
                console.log("   BaseURI Read Error: " + err + "\n")
                if(Number(n.block) <= rejectBlock){
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    console.log(`   ${n.contract} : ${n.baseURI} is rejected.`)
                }
                if(Number(n.block) <= staleBlock){
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "stale"}})
                    console.log(`   ${n.contract} : ${n.baseURI} is stale.`)
                }
                continue;
            }

            try{
                var content = nft.content;
                var contract = content.contract;
                var distributor = content.distributor;
                var signature = nft.signature

                if(content === undefined || contract === undefined || distributor === undefined || signature === undefined || content.name === undefined ){
                    console.log("   Invalid nft format.")
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    continue;
                }
                if(content === null || contract === null || distributor === null || signature === null || content.name === undefined){
                    console.log("   Invalid nft format.") 
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    continue;
                }
                if((content.image === undefined || content.image === null) && (content.audio === undefined || content.audio === null) && 
                   (content.video === undefined || content.video === null) && (content.model === undefined || content.model === null)){
                    console.log(`   Invalid nft content (no base content)`)
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    continue;
                }
                
                if(n.contract !== contract || n.distributor !== distributor){
                    console.log(`   Invalid nft BaseURI (wrong contract or distributor)`);
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    continue;
                }

                // contract may now be used over n.contract.

                // Verify sig
                try{
                    var hash =  web3.utils.soliditySha3(JSON.stringify(content))

                    verifySigner = web3.eth.accounts.recover(hash, signature)

                    console.log(`   Signer: ${verifySigner}`)

                    if(verifySigner.toString() !== distributor){
                        console.log("    signature.")
                        await db.collection('nft').updateOne({contract: contract}, {$set: {state: "rejected"}})
                        continue;
                    }

                }catch{
                    console.log("    signature operation.")
                    await db.collection('nft').updateOne({contract: contract}, {$set: {state: "rejected"}})
                }

                // Validate content subURIs.   
                var result = await validateURIs(content, block, baseURI)

                // continue if result throws invalid subURI
                if(result.status !== true){
                    console.log("   Invalid NFT content (subURIs).")
                    await db.collection('nft').updateOne({contract: contract}, {$set: {state: "rejected"}})
                    continue;
                }

                for(var i of result.insert){
                    console.log(`   uri collection INSERT: ${i.uri},`);
                    await db.collection("uri").insertOne(i)
                }

                for(var u of result.update){
                    console.log(`   uri collection UPDATE: ${u.contract},`)
                    await db.collection("uri").updateOne({uri: u.uri}, {$set: {contract: u.contract, distributor: u.distributor, block: u.block, baseURI: u.baseURI}})
                }

                for(var s of result.slash){
                    console.log(`   slash collection SLASH: ${s},`)
                    await db.collection("slash").insertOne({slash: s})
                }

                // Create verification transaction.
                var subURIs = result.subURIs;
                var leaf;
                switch(subURIs.length){
                    case 1:
                        leaf = web3.utils.soliditySha3(contract, distributor, baseURI, subURIs[0], block);
                        break; 
                    case 2:
                        leaf = web3.utils.soliditySha3(contract, distributor, baseURI, subURIs[0], subURIs[1], block)
                        break; 
                    case 3:
                        leaf = web3.utils.soliditySha3(contract, distributor, baseURI, subURIs[0], subURIs[1], subURIs[2], block)
                        break; 
                    case 4:
                        leaf = web3.utils.soliditySha3(contract, distributor, baseURI, subURIs[0], subURIs[1], subURIs[2], subURIs[3], block)
                        break; 
                }
                //console.log(`leaf: ${leaf.toString('hex')}`)

                //console.log(await db.listCollections({ name: "transactions" }).hasNext())
                /*
                while(!db.listCollections({ name: "transactions" }).hasNext()){
                    console.log("transactions collection doesn't exists");
                    await new Promise(r => setTimeout(r, 2000));
                }*/

                //console.log(`Submitting Transaction: 0x${leaf.toString('hex')}`)

                var transaction = await db.collection("transactions").insertOne({leaf: leaf})

                console.log(`   transaction: ${JSON.stringify(transaction)}`);

                await db.collection("nft").updateOne({contract: contract}, {$set: {state: "verified", content: result.content}})

            }catch(err){
                console.log("err" + err);
            }
        }
        console.log()
        return;
    }

    hostNFTs = async () =>{
        console.log("Hosting NFTs:")
        var nfts = await db.collection("nft").find({state: "verified"}).toArray();

        var currentBlock = await web3.eth.getBlockNumber();

        var rejectBlock = currentBlock - (48 * slot); // 21600

        for(var n of nfts){

            console.log(`   Attempting to host: ${n.baseURI}`);

            var baseFile;

            var cid;
            
            try{
                cid = n.baseURI.replace("ipfs://", "");

                var data = uint8arrays.concat(await all(ipfs.files.read("/ipfs/" + cid, {length: 100000, timeout: 2000})));

                //console.log(`Base URI data length: ${data.length}`);
                var decodedData = new TextDecoder().decode(data).toString();

                //console.log(`file content: ${decodedData}`)
                
                baseFile = JSON.parse(decodedData);

                //console.log(`   nft is json`)

                //console.log(baseFile)
                
            }catch(err){
                console.log("BaseURI Read Error:" + err)
                if(n.block <= rejectBlock){
                    await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "rejected"} })
                }
                continue;
            }

            var subURIs = [baseFile.content.image, baseFile.content.audio, baseFile.content.video, baseFile.content.model];

            var subFiles = [];

            var host = true;

            for(var u of subURIs){
                if(u === undefined){
                    continue;
                }
                try{
                    var _cid = u.replace("ipfs://", "")
                    var data = uint8arrays.concat(await all(ipfs.files.read("/ipfs/" + _cid, {length: 100000000, timeout:2000})));

                    var buf = Buffer.from(data);
                    //console.log(buf)

                    var type = mime_kind(buf);

                    if(type != null  && !uri_ext.includes(type.ext)){
                        console.log("   Invalid file type");
                        await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "rejected"} })
                        host = false;
                        break;
                    }

                    subFiles.push({cid: _cid,  buffer: buf})

                    //console.log(type)
                }catch(err){
                    console.log("SubURI Read Error:" + err)
                    host = false;
                    if(n.block <= rejectBlock){
                        host = false
                        await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "rejected"} })
                    }
                    break;
                }
            }
            if(host){
                console.log(`   writing files for : ${cid}.json`)

                fs.writeFile(`${uploadPath}${cid}.json`, JSON.stringify(baseFile, null, 4), (err) =>{
                    if(err) console.log(err);

                    //console.log(`   writing baseURI file: ${cid}.json`);
                })

                await ipfs.pin.add(CID.parse(cid))
                
                for(var f of subFiles){
                    fs.writeFile(`${uploadPath}${f.cid}`, f.buffer, (err) =>{
                        if(err) console.log(err);

                        //console.log(`   writing subURI file: ${f.cid}.${f.ext}`);
                    })
                    await ipfs.pin.add(CID.parse(f.cid))
                }
                
                await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "hosted"} })
            }
        }
        console.log()
        return;
    }

    slashNFTs = async() =>{
        console.log("Slashing NFTs:")

        var slash = (await db.collection("slash").find({}).toArray()).map(s => s.slash);

        if(slash.length > 0){
            console.log(`   Slash: `+ slash);
            try{
                await nftProtocol.slashNFTs(slash);
                await db.collection("slash").drop();
            }
            catch(err){
                console.log("   Slash error: " + err)
            }
        }
        console.log()
        return;
    }

    staleNFTs = async () =>{
        console.log(`Stale NFTs: ${stale}`)

        if(stale % 10 === 0){
            console.log(`   Reinstating stale nfts`)
            db.collection("nft").updateMany({state: "stale"}, {$set:{state: "new"}})
        }
        stale++;
        console.log()
        return;
    }

    submitBlock = async() =>{
        // Aggregate transactions.
        try{
            var blockNumber = await web3.eth.getBlockNumber();

            if(blockNumber < targetBlock){
                return;
            }
            console.log("Submitting Target Block: " + targetBlock + " Hit.");

            var latestBlock = await nftProtocol.latestBlock();

            var leaves = (await db.collection("transactions").find({}).toArray()).map(l => l.leaf);

            if(leaves.length == 0){
                targetBlock += slot;
                console.log()
                return;
            }

            console.log("   Current transactions:" + leaves)

            var tree = new MerkleTree(leaves, keccak256, {sort: true});

            var root = tree.getHexRoot();

            var prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._block);

            var block = {_prev: prev, _root: root, _leaves: leaves, _block: 0}

            try{
                var receipt = await nftProtocol.submitBlock(block);
                console.log(`   Submitted Block: ${receipt.logs[0].args[0]._root}`);
            }
            catch(err){
                console.log(err + "submitError" + "\n")
                return;
            }

            await db.collection("transactions").drop();

            await db.createCollection("transactions"); 
            
            targetBlock += slot;
            
            //console.log(blockNumber)
        }
        catch(err){
            console.log(err);
        }
        console.log()
        return;
    }

    // Process requests.
    await nftProtocol.verificationRequest().on('data', async (event) => {

        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block;
        console.log(`Verifiaction Request -- contract: ${event.returnValues._contract}, distributor: ${event.returnValues._distributor}, 
                                             baseURI: ${event.returnValues._baseURI}, block: ${block}` );

        await db.collection("nft").insertOne({contract: contract, distributor: distributor, baseURI: baseURI, state: "new", block: block})  

    });

    var connected = await web3.eth.net.isListening();

    if(!connected){
        console.log(`Web3 didn't connect!`);
    }

    var latest = await nftProtocol.latestBlock();
    var block = await web3.eth.getBlockNumber();
    var slot = 5;
    var interval = 5;
    var targetBlock = block + slot;
    var stale = 1;
    console.log(`Target Block: ${targetBlock}`);

    // TODO: process requests from last block to current (block);

    console.log(`Latest block: ${latest}`);

    var events = await nftProtocol.getPastEvents('verificationRequest', {fromBlock: latest._block, toBlock: block.toString()})

    for(var event of events){
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block;
        console.log(`Verifiaction Request -- contract: ${contract}, distributor: ${distributor}, 
                                             baseURI: ${baseURI}, block: ${block}` );

        await db.collection("nft").insertOne({contract: contract, distributor: distributor, baseURI: baseURI, state: "new", block: block})  
    }

    // Core Interval loop.
    while(true){

        await verifyNFTs();

        await submitBlock();

        await slashNFTs();

        await hostNFTs();

        await staleNFTs()

        await new Promise(p => setTimeout(p, interval * 1000))
    }
    
}

module.exports = core
const contract = require('@truffle/contract');

const { MerkleTree } = require('merkletreejs')

const {CID, multiaddr} = require('ipfs');

const all = require("it-all");

const uint8arrays = require('uint8arrays');

const deployedContracts = require('../../src/data/Deployed_Contracts.json');

const networkData = require('../../src/data/Network_Data.json');

const keccak256 = require('keccak256');

const NFTProtocol = contract(require('../../src/contracts/NFTProtocol.json'));

var nftProtocol;

const path = require('path');  
const fs = require("fs-extra");

const mime = require('mime-types')

const {sync: mime_kind} = require('mime-kind')

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

    // Process requests.
    nftProtocol.verificationRequest().on('data', async (event) => {

        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block;
        console.log(`Verifiaction Request -- contract: ${event.returnValues._contract}, distributor: ${event.returnValues._distributor}, 
                                             baseURI: ${event.returnValues._baseURI}, block: ${block}` );

        await db.collection("nft").insertOne({contract: contract, distributor: distributor, baseURI: baseURI, state: "new", block: block})  

    });

    // Function utilized to verify subURIs in an nft.
    validateURIs =  async (content, block, baseURI) =>{

        var main = [content.image, content.audio, content.video, content.model] 
        var res = {status: false, main: [], content: {}, slash: [], update: [], insert: []}
        var contract = content.contract;
        var distributor = content.distributor;
        /*
        console.log(content.image.replace("ipfs://",""))
        var cid = CID.parse(content.image.replace("ipfs://","a"))
        console.log(cid)*/
        var i = 0;
        for(var a of main){
            if(a !== undefined){
                if(a.length !== 53){
                    return res;
                }
                if(a.substring(0,7) !== "ipfs://"){
                    return res;
                }
                try{
                   CID.parse(a.replace("ipfs://", ""));
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
                    console.log(`       ${distributor} is distributor slash: ${data} and update.`)
                    res.slash.push(data);
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
        //console.log("Evaluating nft requests...")
        var nfts = await db.collection("nft").find({state: "new"}).toArray();

        var curBlock =  await web3.eth.getBlockNumber();

        var staleThresh = curBlock - 21600;

        //21600 12hrs of blocks --- stale

        //TODO stale-verify

        for(var n of nfts){
            var baseURI = n.baseURI;
            var block = n.block;
            console.log(`NFT Info, contract: ${n.contract}, distributor: ${n.distributor}, baseURI: ${n.baseURI}, state: ${n.state},\n block: ${n.block}`)
            var cid = n.baseURI.replace("ipfs://" , "");
            console.log(`   cid: ${cid}`);

            var nft;
            
            try{
                var data = uint8arrays.concat(await all(ipfs.files.read(CID.parse(cid), {length: 100000})));

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
                console.log("   BaseURI Read Error:" + err)
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
                    var hash =  web3.utils.sha3(JSON.stringify(content))

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
                    console.log(`   uri collection INSERT: ${i},`);
                    await db.collection("uri").insertOne(i)
                }

                for(var u of result.update){
                    console.log(`   uri collection UPDATE: ${u},`)
                    await db.collection("uri").updateOne({uri: u.uri}, {$set: {contract: u.contract, distributor: u.distributor, block: u.block, baseURI: u.baseURI}})
                }

                for(var s of result.slash){
                    console.log(`   slash collection SLASH: ${s},`)
                    await db.collection("slash").insertOne({slash: s})
                }

                // Create verification transaction.
                var subURIs = result.main;
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
                while(!db.listCollections({ name: "transactions" }).hasNext()){
                    console.log("transactions collection doesn't exists");
                    await new Promise(r => setTimeout(r, 2000));
                }

                //console.log(`Submitting Transaction: 0x${leaf.toString('hex')}`)

                var transaction = await db.collection("transactions").insertOne({leaf: leaf})

                console.log(`   transaction: ${JSON.stringify(transaction)}`);

                await db.collection("nft").updateOne({contract: contract}, {$set: {state: "verified", content: result.content}})

            }catch(err){
                console.log(err);
            }
        }
    } 


    hostNFTs = async () =>{
        var nfts = await db.collection("nft").find({state: "verified"}).toArray();

        // TODO stale-host

        for(var n of nfts){

            console.log(`   Attempting to host: ${n.baseURI}`);

            var baseFile;

            var cid;
            
            try{
                cid = n.baseURI.replace("ipfs://", "");
                var data = uint8arrays.concat(await all(ipfs.files.read(CID.parse(cid), {length: 100000})));

                //console.log(`Base URI data length: ${data.length}`);
                var decodedData = new TextDecoder().decode(data).toString();

                //console.log(`file content: ${decodedData}`)
                
                baseFile = JSON.parse(decodedData);

                console.log(`   nft is json`)

                //console.log(baseFile)
                
            }catch(err){
                console.log("BaseURI Read Error:" + err)
                continue;
            }

            var subURIs = [baseFile.content.image, baseFile.content.audio, baseFile.content.video, baseFile.content.model];

            var subFiles = [];

            for(var u of subURIs){
                if(u === undefined){
                    continue;
                }
                try{
                    var _cid = u.replace("ipfs://", "")
                    var data = uint8arrays.concat(await all(ipfs.files.read(CID.parse(_cid), {length: 100000000})));

                    var buf = Buffer.from(data);
                    //console.log(buf)

                    var type = mime_kind(buf);

                    if(!uri_ext.includes(type.ext)){
                        console.log("   Invalid file type");
                        continue;
                    }

                    subFiles.push({cid: _cid, ext: type.ext, buffer: buf})

                    //console.log(type)
                }catch(err){
                }
            }

            console.log("   writing files...")

            fs.writeFile(`${uploadPath}${cid}.json`, JSON.stringify(baseFile, null, 4), (err) =>{
                if(err) console.log(err);

                console.log(`   writting baseURI file: ${cid}.json`);
            })

            await ipfs.pin.add(CID.parse(cid))
            
            for(var f of subFiles){
                fs.writeFile(`${uploadPath}${f.cid}.${f.ext}`, f.buffer, (err) =>{
                    if(err) console.log(err);

                    console.log(`   writting subURI file: ${f.cid}.${f.ext}`);
                })
                await ipfs.pin.add(CID.parse(f.cid))
            }
            
            await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "hosted"} })
        }
    }

    // Verify/Host IPFS nft data
    setInterval(async() =>{

        await verifyNFTs();

        await hostNFTs();

        // TODO: handle stale-verify and stale-host states

        // TODO: handle slashed nfts

    }, 5000)
    
    
    // Aggregate transactions.
    var slot = 5;
    var targetBlock = await web3.eth.getBlockNumber() + slot;
    console.log(`Target Block: ${targetBlock}`);
    setInterval(async() =>{
        var blockNumber = await web3.eth.getBlockNumber();

        if(blockNumber < targetBlock){
            return;
        }
        console.log("Target Block: " + targetBlock + " Hit.");

        var latestBlock = await nftProtocol.latestBlock();

        var leaves = (await db.collection("transactions").find({}).toArray()).map(l => l.leaf);

        console.log("transactions:" + leaves)

        await db.collection("transactions").drop();

        await db.createCollection("transactions");

        if(leaves.length == 0){
            targetBlock += slot;
            return;
        }
        var tree = new MerkleTree(leaves, keccak256, {sort: true});

        var root = tree.getHexRoot();

        var prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._block);

        var block = {_prev: prev, _root: root, _leaves: leaves, _block: 0}

        try{
           var receipt = await nftProtocol.submitBlock(block)
           console.log(`Submitted Block: ${JSON.stringify(receipt.logs[0].args)}`)
        }
        catch(err){
            console.log(err + "submitError")
        }       
        
        targetBlock += slot;
        
        //console.log(blockNumber)
    }, 60000)
}

module.exports = core
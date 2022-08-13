const contract = require('@truffle/contract');

const { MerkleTree } = require('merkletreejs')

const {CID} = require('multiformats/cid');

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

const uploadPath = path.join(__dirname, 'nft/'); // Register the upload path
fs.ensureDir(uploadPath); // Make sure that he upload path exits

var uri_ext = ["jpg", "jpeg", "png", "gif", "svg", "mp3", "mpga", "wav", "ogg", "oga", "mp4", "webm", "glb", "gltf"];

core = async (db, web3, ipfs) =>{

    var wallet = web3.eth.accounts.wallet;

    var account = wallet["4"].address;

    //console.log(account)
    
    // TODO handle multiple providers. MASS UPGRADE.

    var provider = await web3.eth.currentProvider;

    var chainId = await web3.eth.getChainId();

    var providerName = networkData[chainId].chainName;

    console.log(await web3.eth.getChainId())

    await NFTProtocol.setProvider(provider);

    await NFTProtocol.setWallet(web3.eth.accounts.wallet);

    await NFTProtocol.defaults({from: account});

    console.log(`NFTProtocol Address: ${deployedContracts[providerName].NFTProtocol.address}`)

    nftProtocol = await NFTProtocol.at(deployedContracts[providerName].NFTProtocol.address);

    //var connected = await web3.eth.net.isListening();

    //console.log(`connected: ${connected}`)

    /*
    if(!connected){
        console.log(`Web3 didn't connect!`);
    }*/

    //var owner = await nftProtocol.owner();

    // Function utilized to verify subURIs in an nft.
    validateURIs = async (subURIs, block) =>{

        var res = {status: false, error: "", subURIs: [], subCIDs: [], slash : []}
       
        for(var u of subURIs){
            if(u !== undefined){
                if(typeof u !== 'string'){
                    res.error = `Invalid subURI type ${typeof u}.`;
                    return res;
                }
                var cid;
                var filename;
                if(u.substring(0,7) !== "ipfs://" || (cid = u.replace("ipfs://", "").split("?filename=")).length != 2){
                    res.error = `Invalid subURI format. ${u}`
                    return res;
                }
                filename = cid[1];
                try{
                   CID.parse((cid = cid[0]));
                }
                catch{ 
                    return res;
                }
                //console.log(`   CID: ${cid}`)
                if(res.subCIDs.includes(cid)){
                    res.error = `nft already includes cid : ${cid}`;
                    return res;
                }
                var filemime = mime_kind(filename);
                //console.log(`       ${filename} : ${JSON.stringify(filemime)}`);
                if(filemime === null || !uri_ext.includes(filemime.ext)){
                    res.error = `Invalid subURI ext.`
                    return res;
                }
                var cidExists = await db.collection("nft").findOne({subCIDs: cid})
                if(cidExists !== null){
                    console.log(`   subCID '${cid}' already exits.`)
                    if(cidExists.block <= block){
                        res.error = `cid already validiated.`;
                        return res;
                    }
                    console.log(`slash: ${cidExists.contract} and update,`)

                    res.slash.push(cidExists.contract)
                }
                res.subURIs.push(u)
                res.subCIDs.push(cid)
            }
        }
    
        res.status = true;
        return res;
    }

    validateNFT = async (dbNFT, nft) =>{
        var result = {success: false, error: "", subURIs: [], subCIDs: []};
        //console.log("   Parsing Content Format.");

        var content = nft.content;
        var signature = nft.signature;

        if(content === undefined || content === null || Array.isArray(content)){
            result.error = `NFT content was undefined, null or an array. Must be JSON.`
            return result;
        }

        if(typeof signature !== 'string'){
            result.error = 'Invalid signature data type.'
            return result;
        }
        /*
        if(typeof content.name !== 'string'){
            result.error = `Invalid name data type.`;
            return result;
        }*/

        var subURIs = [content.image, content.audio, content.video, content.model];

        if(subURIs[0] === undefined && subURIs[1] === undefined && subURIs[2] === undefined && subURIs[3] === undefined){
            result.error = `NFT had no content, (image, audio, video, model).`
            return result;
        }

        var contract = content.contract;
        var distributor = content.distributor; 
        
        if(dbNFT.contract !== contract || dbNFT.distributor !== distributor){
            result.error = `Invalid contract or distributor in NFT for given baseURI.`
            return result
        }

        //console.log("   Content Format Parsed.");

        //console.log("   Performing signature verification.")

        // Verify sig
        try{
            var hash =  web3.utils.soliditySha3(JSON.stringify(content))

            verifySigner = web3.eth.accounts.recover(hash, signature)

            //console.log(`   Signer: ${verifySigner}`)

            if(verifySigner.toString() !== distributor){
                result.error = `Invalid signer: ${verifySigner.toString()} expected: ${distributor}`
                return result;
            }

        }catch{
            result.error = "signature operation error.";
            return result;
        }

        // Validate content subURIs.   
        var res = await validateURIs(subURIs, dbNFT.block)

        // continue if result throws invalid subURI
        if(res.status !== true){
            result.error = res.error;
            return result;
        }

        for(var s of res.slash){
            var slashTransaction = await db.collection("transactions").findOne({contract: s});
            if(slashTransaction !== null){
                //console.log("slashed contract in transactions. (transaction slash)")
                await db.collection('logs').insertOne({contract: s, error: "Removed slashed nft from transactions."})
                await db.collection("transactions").deleteOne({contract: s})
                await db.collection('nft').updateOne({contract: s}, {$set: {state: "rejected"}});
                continue;
            }
            //console.log("slashed contract already validated (normal slash)")
            await db.collection('nft').updateOne({contract: s}, {$set: {state: "slash"}});
        }

        result.success = true;
        result.subURIs = res.subURIs;
        result.subCIDs = res.subCIDs;
        return result;
    }

    validateFiles = async (subURIs, subCIDs, dbNFT, rejectBlock) =>{
        var result = {success: false, error: "", subFiles: []}

        for(var i = 0; i < subURIs.length; i++){
            try{
                var data = uint8arrays.concat(await all(ipfs.cat("/ipfs/" + subCIDs[i], {length: 100000000, timeout:2000})));

                var buf = Buffer.from(data);

                var filetype = mime_kind(buf);

                var filename = (subURIs[i].replace("ipfs://", "").split("?filename="))[1];

                //console.log(`   subURI filename: ${filename}`);

                var nametype = mime_kind(filename);

                //console.log(`   filetype: ${JSON.stringify(filetype)}, nametype: ${JSON.stringify(nametype)}`);

                if(filetype === null){
                    if(nametype.ext !== "gltf"){
                        result.error = "   Invalid file type (filetype null and not gltf)";
                        return result;
                    }
                    //console.log("   gltf special case, use nametype ext.")
                    result.subFiles.push({cid: subCIDs[i], buffer: buf, ext: nametype.ext})
                }
                else if ((filetype.ext === "xml" && nametype.ext === "svg") || (filetype.ext === "jpg" && nametype.ext === "jpeg") || 
                         (filetype.ext === "oga" && nametype.ext === "ogg") || (filetype.ext === "mp3" && nametype.ext === "mpga")){
                    //console.log("   filetype/nametype mismatch use nametype ext.")
                    result.subFiles.push({cid: subCIDs[i], buffer: buf, ext: nametype.ext})
                }
                else if(!uri_ext.includes(filetype.ext)){
                    result.error = `   Invalid file type (URI extension not valid ${filetype.ext})`;
                    return result;
                }
                else{
                    if(filetype.ext !== nametype.ext){
                        result.error = `   Invalid file type (filetype: ${filetype.ext} doesn't match nametype: ${nametype.ext})`;
                        return result;
                    }
                    result.subFiles.push({cid: subCIDs[i],  buffer: buf, ext: filetype.ext})
                }
            }catch(err){
                //console.log("SubURI Read Error:" + err)
                
                if(dbNFT.block <= rejectBlock){
                    result.error = "    NFT block <= Reject Block";
                    return result;
                }
                return result;
            }
        }

        result.success = true;
        return result;
    }

    writeFiles = async (baseCID, baseFile, subFiles) =>{
        fs.writeFile(`${uploadPath}${baseCID}.json`, JSON.stringify(baseFile, null, 4), (err) =>{
            if(err) console.log(err);

            //console.log(`   writing baseURI file: ${baseCID}.json`);
        })

        await ipfs.pin.add(CID.parse(baseCID))
        
        for(var f of subFiles){
            fs.writeFile(`${uploadPath}${f.cid}.${f.ext}`, f.buffer, (err) =>{
                if(err) console.log(err);

                //console.log(`   writing subURI file: ${f.cid}.${f.ext}`);
            })
            await ipfs.pin.add(CID.parse(f.cid))
        }
    }

    createTransaction = async (contract, distributor, baseURI, subURIs, block) => {
        var leaf;
        //console.log(`   transaction: contract: ${contract}, distributor: ${distributor}, baseURI: ${baseURI}, subURIs: ${subURIs}, block: ${block}`)
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
        }

        //console.log(`   leaf: ${leaf}`);

        await db.collection("transactions").insertOne({contract: contract, leaf: leaf})

        return leaf;

    }

    verifyNFTs = async () =>{
        console.log('\x1b[35m%s\x1b[0m', "Verifying NFTs: {")
        var nfts = await db.collection("nft").find({state: "new"}).toArray();

        //console.log(nfts)

        var currentBlock =  await web3.eth.getBlockNumber();

        var staleBlock = currentBlock - (4 * slot);// 7200 blocks // Original 21600;

        var rejectBlock = currentBlock - (48 * slot);

        for(var n of nfts){
            var baseCID = n.baseCID;
            //console.log(`   NEW NFT Info: contract: ${n.contract}, distributor: ${n.distributor}, \n                baseCID: ${n.baseCID}, state: ${n.state}, block: ${n.block}`)
            //console.log(`   CID: ${baseCID}`);

            var nft;
            
            try{
                var data = uint8arrays.concat(await all(ipfs.cat("/ipfs/" + baseCID, {length: 100000, timeout: 2000})));

                var decodedData = new TextDecoder().decode(data).toString();

                try{
                    nft = JSON.parse(decodedData);
                }
                catch{
                    await db.collection(`logs`).insertOne({contract: n.contract, error: "   Invalid nft json format."});
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    continue;
                }
            }catch(err){
                console.log("   BaseCID Read Error: " + err + "\n")
                if(Number(n.block) <= rejectBlock){
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    console.log(`   ${n.contract} : ${n.baseCID} is rejected.`)
                }
                if(Number(n.block) <= staleBlock){
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "stale"}})
                    console.log(`   ${n.contract} : ${n.baseCID} is stale.`)
                }
                continue;
            }
            try{
                var result = await validateNFT(n, nft);
                if(!result.success){
                    console.log('\x1b[31m%s\x1b[0m',`Rejected: { contract: ${n.contract}, error: ${result.error} },`);
                    await db.collection('logs').insertOne({contract: n.contract, error: result.error})
                    await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                    //var nft0 =  await db.collection('nft').findOne({contract: n.contract});
                    //console.log(nft0)
                    continue;
                }

                //console.log(`   Parsed ${n.contract}!`);

                // Validate NFT files.
                var res = await validateFiles(result.subURIs, result.subCIDs, n, rejectBlock);
                if(!res.success){
                    console.log(res.error);
                    if(res.error !== ""){
                        console.log('\x1b[31m%s\x1b[0m',`Rejected: { contract: ${n.contract}, error: ${res.error} },`);
                        await db.collection('logs').insertOne({contract: n.contract, error: res.error})
                        await db.collection('nft').updateOne({contract: n.contract}, {$set: {state: "rejected"}})
                        continue;
                    }
                    else{
                        await db.collection('logs').insertOne({contract: n.contract, error: "subURI Read Error."})
                        continue;
                    }
                }

                //console.log(`   writing files for : ${baseCID}.json`)

                // write nft files.
                await writeFiles(baseCID, nft, res.subFiles)

                // Create verification transaction.
                var transaction = await createTransaction(n.contract, n.distributor, n.baseURI, result.subURIs, n.block);
                
                await db.collection("nft").updateOne({contract: n.contract}, {$set: {state: "verified", subURIs: result.subURIs, subCIDs: result.subCIDs}})

                console.log('\x1b[32m%s\x1b[0m', `  Verified: { contract: ${n.contract}, transaction: ${transaction} },`)
            }
            catch(err){
                console.log(`Validation ERROR: ${err},`)
            }
        }
        console.log('\x1b[35m%s\x1b[0m',"}\n")
        return;
    }

 
    slashNFTs = async() =>{
        //console.log("Slashing NFTs: {")

        var slash = (await db.collection("nft").find({state: "slash"}).toArray()).map(s => s.contract);

        //TODO remove slashed nft files.

        if(slash.length > 0){
            console.log('\x1b[31m%s\x1b[0m',`Slash: `+ slash);
            try{
                await nftProtocol.slashNFTs(slash);
                await db.collection("nft").updateMany({state: "slash"}, {$set: {state: "rejected"}});
                await db.collection("logs").insertOne({slashed: slash});
            }
            catch(err){
                console.log("   Slash error: " + err)
            }
        }
        //console.log()
        return;
    }

    staleNFTs = async () =>{

        if(stale % 10 === 0){
            console.log('\x1b[33m%s\x1b[0m', `Stale NFTs: ${stale}\n`)
            db.collection("nft").updateMany({state: "stale"}, {$set:{state: "new"}})
        }
        stale++;
        //console.log()
        return;
    }

    submitBlock = async() =>{
        // Aggregate transactions.
        try{
            var blockNumber = await web3.eth.getBlockNumber();

            if(blockNumber < targetBlock){
                return;
            }
            console.log('\x1b[32m%s\x1b[0m',`Submitting Target Block: {\n   Block: ${targetBlock}`);

            var latestBlock = await nftProtocol.latestBlock();

            var leaves = (await db.collection("transactions").find({}).toArray()).map(l => l.leaf);

            if(leaves.length == 0){
                targetBlock += slot;
                console.log('\x1b[32m%s\x1b[0m', "}\n")
                return;
            }

            var ipfsLeaves = {leaves};

            var cid = (await ipfs.add(JSON.stringify(ipfsLeaves))).cid.toString();

            fs.writeFile(__dirname + "/leaves/" + (cid + ".json"), JSON.stringify(ipfsLeaves, null, 4), (e) =>{
                if(e){
                    console.log(`error writing ${cid + ".json"}`);
                }
            })

            await ipfs.pin.add(CID.parse(cid));

            //console.log("   Current transactions:" + leaves)

            var tree = new MerkleTree(leaves, keccak256, {sort: true});

            var root = tree.getHexRoot();

            var prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._leaves, latestBlock._block);

            var block = {_prev: prev, _root: root, _leaves: cid, _block: 0}

            try{
                var contractBalance = await web3.eth.getBalance(nftProtocol.address);
                console.log(contractBalance);

            }catch(e){
                console.log("nft protocol claim error: " + e)
            }
            
            try{
                var receipt = await nftProtocol.submitBlock(block);
                console.log('\x1b[32m%s\x1b[0m',`   Submitted Root: ${receipt.logs[0].args[0]._root} \n}\n`);
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
        //console.log()
        return;
    }

    // Process requests.
    await nftProtocol.verificationRequest().on('data', async (event) => {

        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block;
        
        var baseCID = baseURI.replace("ipfs://", "");

        try{
            CID.parse(baseCID)
        }
        catch(err){
            console.log("Invalid base CID in Verification Request.")
            return;
        }

        console.log('\x1b[36m%s\x1b[0m',`Verification Request: { contract: ${contract}, distributor: ${distributor},baseCID: ${baseCID}, block: ${block} }\n` );

        await db.collection("nft").insertOne({contract: contract, distributor: distributor, baseURI: baseURI, baseCID: baseCID, state: "new", block: block})  

    });

    var latest = await nftProtocol.latestBlock();
    var block = await web3.eth.getBlockNumber();
    var slot = 20;
    var interval = 20;
    var targetBlock = block + slot;
    var stale = 1;
    console.log(`Target Block: ${targetBlock}`);

    console.log(`Latest block: ${latest}`);

    var events = await nftProtocol.getPastEvents('verificationRequest', {fromBlock: latest._block, toBlock: block.toString()})

    for(var event of events){
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block;
        var baseCID = baseURI.replace("ipfs://", "");

        try{
            CID.parse(baseCID)
        }
        catch(err){
            console.log("Invalid base CID in Verification Request.")
            return;
        }

        console.log('\x1b[36m%s\x1b[0m',`Verification Request: { contract: ${contract}, distributor: ${distributor},baseCID: ${baseCID}, block: ${block} }\n` );

        var nft = await db.collection("nft").findOne({contract})

        if(nft === null){
            await db.collection("nft").insertOne({contract: contract, distributor: distributor, baseURI: baseURI, baseCID: baseCID, state: "new", block: block})  
        }
    }

    // Core loop.
    while(true){
        try{
            await verifyNFTs();

            await submitBlock();

            await slashNFTs();

            await staleNFTs()

            await new Promise(p => setTimeout(p, interval * 1000))
        }
        catch(err){
            console.log("Fatal Core loop ERROR: " + err)
        }
    }
    
}

module.exports = core
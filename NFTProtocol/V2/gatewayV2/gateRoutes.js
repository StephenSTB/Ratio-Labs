const CID = require('multiformats/cid').CID
const path = require('path');  
//const fs = require("fs-extra");

const fs = require('fs');

const mime = require('mime-types');

const {sync: mime_kind, async} = require('mime-kind');

const uploadPath = path.join(__dirname, 'gatenft/'); // Register the upload path
//fs.ensureDir(uploadPath); // Make sure that he upload path exits

var uri_ext = ["jpg", "png", "gif", "svg", "mp3", "wav", "ogg", "mp4", "webm","glb", "gltf"];

routes = (app, db, ipfs, web3) =>{
    app.get("/", (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send({greet: "Welcome to Ratio Gateway"})
        console.log("Pinged")
    })

    app.get("/state", async (req, res) =>{

        console.log(`\nContract state query:`)

        var contract = req.query.contract;

        if(contract === undefined || contract === null || !web3.utils.isAddress(contract)){
            res.status(400).json({"status": "failed", "reason": "Invalid contract address format."})
            return;
        }

        var data = await db.collection("nft").findOne({contract: contract});

        if(data === null || data === undefined){
            res.status(400).json({"status": "failed", "reason": "Invalid nft status."})
            return;
        }

        console.log(`   ${contract} state: ${data.state}\n`)

        res.status(200).json({status: "success", state: data.state});

    });

    validateNFT = async(dbNFT, nft) =>{

        var result = {success: false, error: "", subCIDs: []};

        console.log("   Parsing Content Format.");

        var content = nft.content;
        var signature = nft.signature;

        if(content === undefined || signature === undefined){
            result.error = `undefined NFT content or signature.`
            return result;
        }

        var contract = content.contract;
        var distributor = content.distributor; 
        
        if(contract === undefined || distributor === undefined || content.name === undefined){
            result.error = `NFT had undefined contract, distributor or name.`
            return result;
        }

        var subURIs = [content.image, content.audio, content.video, content.model];

        if(subURIs[0] === undefined && subURIs[1] === undefined && subURIs[2] === undefined && subURIs[3] === undefined){
            result.error = `NFT had no content, (image, audio, video, model).`
            return result;
        }
        
        if(distributor !== dbNFT.distributor){
            result.error = `Invalid contract or distributor in NFT for given baseURI.`
            return result;
        }

        if(!(web3.utils.isAddress(contract) && web3.utils.isAddress(distributor))){
            result.error = `Invalid contract or distributor address given.`
            return result;
        }

        console.log("       Content Format Success.\n");

        console.log(`   Verifying Contract ${contract} Format:`)

        var baseCID = dbNFT.baseCID;

        console.log(`       BASE_CID: '${baseCID}'`);

        var ipfsCID;

        console.log("       Base CID size:" + Buffer.from(JSON.stringify(nft)).length)
        ipfsCID = await ipfs.add(JSON.stringify(nft));
       
        console.log(`       ipfs base cid: "${ipfsCID.cid}"`);

        if(baseCID !== ipfsCID.cid.toString()){
            result.error = `Invalid nft cid: ${baseCID} for given contract: ${dbNFT.contract}`
            return result;
        }

        var cidExists = await db.collection("nft").findOne({baseURI: dbNFT.baseURI, state: "verified"});

        if(cidExists !== null){
            result.error = `baseURI: ${dbNFT.baseURI} already validated for contract: ${cidExists.contract}, self host for oracle to correct.`
        }

        var res = await validateURIs(subURIs);

        console.log(`       Sub CIDs Valid: ${JSON.stringify(res)}`)

        if(res.status !== true){
            result.error = "Invalid nft subURIs given."
            return result;;
        }

        result.subCIDs = res.subCIDs;

        console.log(`       Contract Request Format Success.`)

        try{
            var hash =  web3.utils.soliditySha3(JSON.stringify(content))

            verifySigner = web3.eth.accounts.recover(hash, signature)

            if(verifySigner.toString() !== distributor){
                result.error("Invalid nft signature.");
                return result;
            }

            console.log("NFT JSON VERIFIED!");
            result.success = true;
            return result;
            
        }catch{
            result.error = `Invalid nft`;
            return result;
        }
    }

    validateURIs = async (subURIs) =>{

        var res = {status: false, subCIDs: []}

        for(var u of subURIs){
            if(u !== undefined){
                console.log(`   Validating subURI: ${u}`)
                var cid;
                var filename;
                if(u.substring(0,7) !== "ipfs://" || (cid = u.replace("ipfs://", "").split("?filename=")).length != 2){
                    console.log(`       CID: ${cid}`);
                    return res;
                }
                filename = cid[1];
                try{
                    CID.parse((cid = cid[0]));
                }
                catch{ 
                    return res;
                }
                console.log(`   CID: ${cid}`)
                if(res.subCIDs.includes(cid)){
                    console.log(`       nft already includes cid : ${cid}`)
                    return res;
                }
                var filemime = mime_kind(filename);
                console.log(`       ${filename} : ${filemime}`);
                if(filemime === null || !uri_ext.includes(filemime.ext)){
                    console.log(`       Invalid ext.`)
                    return res;
                }
                var dbCID = await db.collection("nft").findOne({subCIDs: cid});
                if(dbCID !== null){
                    console.log(`   ${u} cid already exits.`)
                    return res;
                }
                res.subCIDs.push(cid)
            }
        }
        res.status = true;
        return res;
    }

    unlinkFiles = (writtenFiles) =>{
        for(var file of writtenFiles){
            console.log(`   DELETE : ${file}`)
            fs.unlinkSync(path.join(uploadPath, file));
        }
    }

    validateFiles = async (success, subCIDs, writtenFiles, nft, dbNFT) =>{
        console.log("Validating Written Files.")

        var result = {status: false, subCIDs: []}

        if(!success){
            console.log(`   Invalid success state: ${success}`)
            unlinkFiles(writtenFiles)
            return result;
        }
        // Validate written files.
        for(var i = 0 ; i < writtenFiles.length; i++){
            var file = fs.readFileSync(path.join(uploadPath, writtenFiles[i]));
            
            var cid = (await ipfs.add(file)).cid.toString();

            var given = (writtenFiles[i].split("."))[0]

            if(cid !== given){
                console.log(`   Given file CID :  did not match actual CID : ${cid}`);
                unlinkFiles(writtenFiles);
                return result;
            }

            if(!subCIDs.includes(cid)){
                console.log(`   cid: ${cid} was not included in subCIDs ${subCIDs}.`)
                unlinkFiles(writtenFiles);
                return result;
            }
            subCIDs.splice(subCIDs.indexOf(cid))

            result.subCIDs.push(cid)
        }
        // All files included condition. 
        if(subCIDs.length !== 0){
            console.log(`   not all subCIDs ${subCIDs} were written.`)
            unlinkFiles(writtenFiles);
            return result;
        }

        console.log("   Written files Validated.")

        // Write NFT file.
        fs.writeFileSync(path.join(uploadPath, (dbNFT.baseCID + ".json")), JSON.stringify(nft, null, 4), (err) =>{
            if(err) console.log(`   Error writing: ${(dbNFT.baseCID + ".json")}`);
        })
        
        await ipfs.add(dbNFT.baseCID);

        result.status = true;
        return result;
    }
    
    app.post("/verify", async (req, res) =>{

        if(req.busboy){
            console.log("Verifying NFT Request.");

            req.pipe(req.busboy);

            var valid = false;

            var nft;

            var dbNFT;

            var subCIDs = [];

            var writtenFiles = [];

            var success = true;

            var count = 0;

            verifyNFT = async () =>{
                count--;
                if(count === 0){
                    var result = await validateFiles(success, subCIDs, writtenFiles, nft, dbNFT);
                    if(!result.status){
                        res.status(400).json({status: "failed", reason: `Given sub files could not be validated for the given NFT.`});
                        return;
                    }
                    await db.collection("nft").updateOne({contract: dbNFT.contract}, {$set: {subCIDs: result.subCIDs, state: "verified"}})
                    var n = await db.collection("nft").findOne({contract: dbNFT.contract});
                    console.log(`NFT FINAL STATE: ${JSON.stringify(n)}`)
                    res.status(200).json({status: "success"})
                    return;
                }
            }
            
            failed = async (file, msg) =>{
                console.log(msg)
                file.resume();
                success = false;
                await verifyNFT()
            }
            
            // Handle form request.
            req.busboy.on('file', async (name, file, info) =>{
                try{
                    count++;
                    console.log(`   file: ${name}, mime: ${info.mimeType}`)

                    var ext = mime.extension(info.mimeType)

                    if(!uri_ext.includes(ext)){
                        await failed(file, `Invalid File ext for ${name}`);
                        return;
                    }
                    var wait = 0;
                    while(valid === false && success === true && wait < 4){
                        console.log(`   ${name} waiting: ${wait}`)
                        await new Promise(p => setTimeout(p, 500));
                        wait++;
                    }

                    if(valid !== true){
                        await failed(file, `NFT JSON file was not validated, valid: ${valid}  success: ${success}`)
                        return;
                    }

                    var fileparse = name.replace("ipfs://", "").split("?filename=")
                    if(fileparse.length !== 2){
                        failed(file, `invalid file parse of ${name}`)
                        return;
                    }

                    var filemime = mime_kind(fileparse[1]);
                    console.log(`       ${name} : ${filemime}`);
                    if(mime === null || !uri_ext.includes(filemime.ext)){
                        failed(file, `invalid file ext for ${name}`)
                        return ;
                    }

                    var cid = fileparse[0];

                    if(!subCIDs.includes(cid)){
                        await failed(file, `Invalid cid: ${cid} for ${name}`)
                        return;
                    }

                    if(writtenFiles.includes((cid + "." + ext))){
                        await failed(file, `written files already includes ${name}`)
                        return
                    }

                    console.log(`   Write subCID file: ${name}`);

                    var fstream = fs.createWriteStream(path.join(uploadPath, cid + "." + ext));

                    file.pipe(fstream);

                    fstream.on('close', async () => {
                        console.log(`   Upload of '${name}' finished, `);

                        writtenFiles.push((cid + "." + ext))

                        await verifyNFT();

                        return;
                    })
                }catch(err){
                    console.log("file validation error: " + err)
                }

            })

            req.busboy.on('field', async (contract, value) =>{
                console.log(`field Evaluation: ${contract}`);
                try{
                    // Get potential nft request.
                    dbNFT = await db.collection("nft").findOne({contract: contract});

                    if(dbNFT === null || dbNFT.state !== 'new'){
                        res.status(400).json({status: "failed", reason: `Verification request from contract: ${contract} doesn't exits.`});
                        return;
                    }

                    nft = JSON.parse(value)
                    console.log("nft: ")
                    console.log(nft)
                    
                    var result = await validateNFT(dbNFT, nft)

                    if(!result.success){
                        success = false;
                        console.log(`Validate NFT ERROR: ${result.error}`)
                        return;
                    }

                    subCIDs = result.subCIDs;
                    valid = true;
                }
                catch(err)
                {
                    console.log("NFT field ERROR." + err)
                    success = false;
                    return
                }
            })

            if(!success){
                res.status(400).json({status: "failed"});
            }
        }
        else{
            console.log("Invalid Request Format.");
            res.status(400).json({status: "failed"}); 
        }  
    })
}

module.exports = routes
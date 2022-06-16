const CID = require('multiformats/cid').CID
const path = require('path');  
//const fs = require("fs-extra");

const fs = require('fs');

const mime = require('mime-types');

const {sync: mime_kind} = require('mime-kind');

const uploadPath = path.join(__dirname, 'gatenft/'); // Register the upload path
//fs.ensureDir(uploadPath); // Make sure that he upload path exits

var uri_ext = ["jpg", "jpeg", "png", "gif", "svg", "mp3", "mpga", "wav", "ogg", "oga", "mp4", "webm", "glb", "gltf"];

routes = (app, db, ipfs, web3) =>{
    app.get("/", (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send({greet: "Welcome to Ratio Gateway"})
        console.log("Pinged")
    })

    app.get("/state", async (req, res) =>{

        //console.log(`\nContract state query:`)

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

        console.log(`Contract state query: \n   { contract: ${contract} state: ${data.state}}\n`)

        res.status(200).json({status: "success", state: data.state});

    });

    validateNFT = async(dbNFT, nft) =>{

        var result = {success: false, error: "", subCIDs: []};

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
        
        if(contract !== dbNFT.contract || distributor !== dbNFT.distributor){
            result.error = `Invalid contract or distributor in NFT for given baseURI.`
            return result;
        }

        //console.log("       Content Format Success.\n");

        //console.log(`   Verifying Contract ${contract} Format:`)

        var baseCID = dbNFT.baseCID;

        //console.log(`       BASE_CID: '${baseCID}'`);

        var ipfsCID;

        //console.log("       Base CID size:" + Buffer.from(JSON.stringify(nft)).length)
        ipfsCID = await ipfs.add(JSON.stringify(nft));
       
        //console.log(`       ipfs base cid: "${ipfsCID.cid}"`);

        if(baseCID !== ipfsCID.cid.toString()){
            result.error = `Invalid nft cid: ${baseCID} for given contract: ${dbNFT.contract}`
            return result;
        }

        var res = await validateURIs(subURIs);

        //console.log(`       Sub CIDs Valid: ${JSON.stringify(res)}`)

        if(res.status !== true){
            result.error = res.error;
            return result;
        }

        result.subCIDs = res.subCIDs;
        result.nametypes = res.nametypes;

        //console.log(`       Contract Request Format Success.`)

        try{
            //console.log(content)
            var hash =  web3.utils.soliditySha3(JSON.stringify(content))

            //console.log(signature)

            verifySigner = web3.eth.accounts.recover(hash, signature)

            //console.log(verifySigner)

            if(verifySigner !== distributor){
                result.error = "Invalid nft signature.";
                return result;
            }

            //console.log("NFT JSON VERIFIED!");
            result.success = true;
            return result;
            
        }catch{
            result.error = `Invalid nft signature operation.`;
            return result;
        }
    }

    validateURIs = async (subURIs) =>{

        var res = {status: false, error: "", subCIDs: [], nametypes: []}

        for(var u of subURIs){
            if(u !== undefined){
                if(typeof u !== 'string'){
                    res.error = `Invalid subURI type. ${typeof u}`;
                    return res;
                }
                //console.log(`   Validating subURI: ${u}`)
                var cid;
                var filename;
                if(u.substring(0,7) !== "ipfs://" || (cid = u.replace("ipfs://", "").split("?filename=")).length != 2){
                    res.error = `Invalid sub CID: ${cid}`;
                    return res;
                }
                filename = cid[1];
                try{
                    CID.parse((cid = cid[0]));
                }
                catch{
                    res.error = `Invalid parse of CID: ${cid}`
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
                    res.error = `Invalid ext.`;
                    return res;
                }
                var dbCID = await db.collection("nft").findOne({subCIDs: cid});
                if(dbCID !== null){
                    res.error = `${u} cid already exits.`;
                    return res;
                }
                res.subCIDs.push(cid)
                res.nametypes.push(filemime.ext)
            }
        }
        res.status = true;
        return res;
    }

    unlinkFiles = (writtenFiles) =>{
        for(var file of writtenFiles){
            //console.log(`   DELETE : ${file}`)
            try{
                fs.unlinkSync(path.join(uploadPath, file));
            }catch{
                //console.log(`   Failed to Delete: ${path.join(uploadPath, file)}` );
            }
            
        }
    }

    validateFiles = async (subCIDs, writtenFiles, nft, dbNFT) =>{
        //console.log("Validating Written Files.")

        var result = {success: false, error: "", subCIDs: []}

        //console.log(subCIDs)

        // Validate written files.
        for(var i = 0 ; i < writtenFiles.length; i++){
            var file = fs.readFileSync(path.join(uploadPath, writtenFiles[i]));

            var cid = (await ipfs.add(file)).cid.toString();

            var given = (writtenFiles[i].split("."))[0]

            if(cid !== given){
                result.error = `   Given file CID :${given}  did not match actual CID : ${cid}`;
                unlinkFiles(writtenFiles);
                return result;
            }

            if(!subCIDs.includes(cid)){
                result.error = `   cid: ${cid} was not included in subCIDs ${subCIDs}.`;
                unlinkFiles(writtenFiles);
                return result;
            }
            //TODO validate writenFile ext with file ext

            
            subCIDs.splice(subCIDs.indexOf(cid), 1)

            result.subCIDs.push(cid)
        }
        // All files included condition. 
        if(subCIDs.length !== 0){
            result.error = `   not all subCIDs ${subCIDs} were written.`;
            unlinkFiles(writtenFiles);
            return result;
        }

        //console.log("   Written files Validated.")

        // Write NFT file.
        fs.writeFileSync(path.join(uploadPath, (dbNFT.baseCID + ".json")), JSON.stringify(nft, null, 4), (err) =>{
            if(err) console.log(`   Error writing: ${(dbNFT.baseCID + ".json")}`);
        })
        
        await ipfs.add(dbNFT.baseCID);

        result.success = true;
        return result;
    }
    
    app.post("/verify", async (req, res) =>{

        if(req.busboy){
            //console.log("Verifying NFT Request.");

            req.pipe(req.busboy);

            var valid = false;

            var nft;

            var dbNFT;

            var subCIDs = [];

            var nametypes = [];

            var writtenFiles = [];

            var success = true;

            var count = 0;

            var fileUploaded = false;

            var failMsg = "";

            verifyNFT = async () =>{
                count--;

                //console.log(count)
                if(count === 0 && success ){
                    var result = await validateFiles(subCIDs, writtenFiles, nft, dbNFT);
                    console.log(result.error)
                    if(!result.success){
                        res.status(400).json({status: "failed", reason: result.error});
                        return;
                    }
                    await db.collection("nft").updateOne({contract: dbNFT.contract}, {$set: {subCIDs: result.subCIDs, state: "verified"}})
                    var n = await db.collection("nft").findOne({contract: dbNFT.contract});
                    //console.log(`NFT FINAL STATE: ${JSON.stringify(n)}`)
                    console.log('\x1b[32m%s\x1b[0m',`Hosted:\n  { contract: ${nft.content.contract}},`)
                    res.status(200).json({status: "success"})
                    return;
                }
                else if(count === 0){
                    failed(null, failMsg, false)
                }
            }
            
            failed = (file, msg, decrement) =>{
                console.log('\x1b[31m%s\x1b[0m', msg + ",")
                try{
                    file.resume();
                }catch{
                    //console.log("   No file to resume")
                }
                if(decrement){
                    count--;
                }
                if((count === 0 || !decrement) && success){
                    success = false;
                    unlinkFiles(writtenFiles);
                    res.status(400).json({status: "failed", reason: msg});
                    return;
                }else{
                    success = false;
                }
                failMsg = msg;
            }
            
            // Handle form request.
            req.busboy.on('file', async (name, file, info) =>{
                try{
                    count++; fileUploaded = true;
                    //console.log(`   file: ${name}, mime: ${JSON.stringify(info.mimeType)}`)

                    var wait = 0;
                    while(valid === false && success === true && wait < 4){
                        //console.log(`   ${name} waiting: ${wait}`)
                        await new Promise(p => setTimeout(p, 500));
                        wait++;
                    }

                    if(!valid && wait === 4){
                        failed(file, "NFT JSON parse time failed.", true);
                        return;
                    }
                    else if(!valid){
                        return;
                    }

                    var ext = mime.extension(info.mimeType)

                    if(!uri_ext.includes(ext)){
                        failed(file, `Invalid File ext for ${name} : ${ext}`, true);
                        return;
                    }

                    var fileparse = name.replace("ipfs://", "").split("?filename=")
                    //console.log(fileparse)
                    if(fileparse.length !== 2){
                        failed(file, `invalid file parse of ${name}`, true)
                        return;
                    }

                    var filemime = mime_kind(fileparse[1]);
                    //console.log(`       ${name} : ${filemime}`);
                    if(filemime === null || !uri_ext.includes(filemime.ext)){
                        failed(file, `invalid file ext for ${name}`, true)
                        return ;
                    }

                    if(filemime.ext != ext){
                        failed(file,` file mime ext: ${filemime.ext} doesn't match actual mime ext: ${ext}`, true)
                        return;
                    }

                    var cid = fileparse[0];

                    if(!subCIDs.includes(cid)){
                        failed(file, `Invalid cid: ${cid} for ${name} (not in nft.)`)
                        return;
                    }

                    if(filemime.ext !== nametypes[subCIDs.indexOf(cid)]){
                        failed(file,` actual mime ext: ${filemime.ext} doesn't match nft mime ext: ${nametypes[subCIDs.indexOf(cid)]}`, true)
                        return;
                    }

                    //console.log(`   Write subCID file: ${name}`);

                    var fstream = fs.createWriteStream(path.join(uploadPath, cid + "." + ext));

                    file.pipe(fstream);

                    fstream.on('close', async () => {
                        //console.log(`   Upload of '${cid + "." + ext}' finished, `);

                        writtenFiles.push((cid + "." + ext))

                        await verifyNFT();

                        return;
                    })
                }catch(err){
                    console.log(`file validation error: ${err},`)
                }

            })

            req.busboy.on('field', async (contract, value) =>{
                console.log('\x1b[33m%s\x1b[0m',`Gate Hosting Request: \n   { contract: ${contract}},`);
                try{
                    // Get potential nft request.
                    dbNFT = await db.collection("nft").findOne({contract: contract});

                    if(dbNFT === null || dbNFT.state !== 'new'){
                        failed(null, `Verification request from contract: ${contract} doesn't exist or is not new.`, false)
                        return;
                    }

                    nft = JSON.parse(value)
                    //console.log("nft: ")
                    //console.log(nft)
                    
                    var result = await validateNFT(dbNFT, nft)

                    if(!result.success){
                        failed(null, `Validate NFT ERROR: ${result.error}`, false)
                        return;
                    }

                    subCIDs = result.subCIDs;
                    nametypes = result.nametypes;
                    valid = true;
                }
                catch(err)
                {
                    failed(null, "NFT field ERROR " + err, false)
                    return;
                }
            })

            req.busboy.on('finish', function (){
                if(!fileUploaded && success === true){
                    //console.log("No file Upload")
                    failed(null, "No files were attached.", false)
                }
            })
        }
        else{
            //console.log("Invalid Request Format.");
            res.status(400).json({status: "failed"}); 
        }  
    })
}

module.exports = routes
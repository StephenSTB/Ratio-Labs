const CID = require('multiformats/cid').CID
const path = require('path');  
//const fs = require("fs-extra");

const fs = require('fs')

const mime = require('mime-types');

const {sync: mime_kind} = require('mime-kind')

const uploadPath = path.join(__dirname, 'gatenft/'); // Register the upload path
//fs.ensureDir(uploadPath); // Make sure that he upload path exits

var uri_ext = ["jpg", "png", "gif", "svg", "mp3", "wav", "ogg", "mp4", "webm","glb", "gltf", "json"];

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
    
    app.post("/verify", async (req, res) =>{

        console.log("\nNFT Verificaiton POST:\n")
        
        console.log("   Parsing Content Format.")
        var body = req.body;

        console.log(body)
        if(body === undefined || body === null){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft given"})
            return;
        }

        var content = body.content
        var signature = body.signature;

        if(content === undefined || content === null || signature === undefined  || signature === null){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft given"})
            return;
        }
        var contract = content.contract;
        var distributor = content.distributor;

        if(contract === undefined || distributor === undefined  || content.name === undefined ||
            contract === null || distributor === null|| content.name === null){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft given"})
            return;
        }

        if((content.image === undefined || content.image === null) && (content.audio === undefined || content.audio === null) && 
           (content.video === undefined || content.video === null) && (content.model === undefined || content.model === null)){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft given"})
            return;
        }

        if(!(web3.utils.isAddress(contract) && web3.utils.isAddress(distributor))){
            res.status(400).json({"status": "Failed", "reason": "Invalid contract or distributor address given."})
            return;
        }  

        console.log("       Content Format Success.\n")

        console.log(`   Verifying Contract ${contract} Format:`)

        var nft;

        try{
            nft = await db.collection("nft").findOne({contract: contract});
            console.log(`   nft: ${JSON.stringify(nft)}`);
        }
        catch(err){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft verification query.`})
            return;
        }

        if(nft === null){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft verification contract.`})
            return;
        }

        if(nft.state !== 'new'){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft status`})
            return;
        }

        if(nft.distributor !== distributor){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft distributor was ${distributor}`})
            return;
        }

        var baseCID = nft.baseURI.replace("ipfs://", "")

        console.log(`   BASE_CID: '${baseCID}'`);

        var ipfsCID;

        try{
            console.log("   Base CID size:" + Buffer.from(JSON.stringify(req.body)).length)
            ipfsCID = await ipfs.add(JSON.stringify(req.body));
        }
        catch(err){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft body`})
            return
        }
        console.log(`   ipfs base cid: "${ipfsCID.cid}"`);

        if(baseCID !==  ipfsCID.cid.toString()){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft cid: ${baseCID}`})
            return
        }

        var cidExists = await db.collection("cid").findOne({cid: baseCID})

        console.log("   Base CID Exists: " + cidExists);

        if(cidExists !== null){
            res.status(400).json({"status": "Failed", "reason": `Invalid base cid (already verified).`})
            return;
        }

        var result = await validateURIs(content);

        console.log(`   Sub CIDs Valid: ${JSON.stringify(result)}`)

        if(result.status !== true){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft content given."})
            return;
        }

        var subCIDs = result.subCIDs;

        console.log(`       Contract Request Format Success.`)

        try{
            var hash =  web3.utils.soliditySha3(JSON.stringify(content))

            verifySigner = web3.eth.accounts.recover(hash, signature)

            //console.log(`   Signer: ${verifySigner}`)

            if(verifySigner.toString() !== distributor){
                res.status(400).json({"status": "Failed", "reason": "Invalid nft signature."})
                return
            }

            await db.collection("cid").insertOne({cid: baseCID, state: "verified", contract: contract});

            var dbBaseCID = await  db.collection("cid").findOne({cid: baseCID});

            console.log(`   dbBaseCID: ${JSON.stringify(dbBaseCID, null, 4)}`)
            
            for(var subCID of subCIDs){
                console.log(`   subCID: ${subCID}`)
                await db.collection("cid").insertOne({cid: subCID, state: "verified", contract: contract});
            }

            var updated = await db.collection("nft").updateOne({contract: contract}, {$set: {state: "verified", content: result.content}})
            //console.log(`   updated: ${JSON.stringify(updated)}`)

            updated = await db.collection("nft").findOne({contract: contract})
            console.log(`   updated: ${JSON.stringify(updated)}\n`)

            console.log(`VERIFIED: ${contract}\n`);

        }catch{
            res.status(400).json({"status": "Failed", "reason": `Invalid nft`})
            return
        }
    
        res.status(200).json({status: "success"})
    })

    validateURIs =  async (content) =>{

        var subURIs = [content.image, content.audio, content.video, content.model] 
        var res = {status: false, subCIDs: [], content: {}}

        var i = 0;
        for(var u of subURIs){
            if(u !== undefined){
                console.log(`   Validating subURI: ${u}`)
                var cid;
                var filename;
                // TODO cid ext ADD to subCIDs array.
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
                var mime = mime_kind(filename);
                console.log(`       ${filename} : ${mime}`);
                if(mime === null || !uri_ext.includes(mime.ext)){
                    console.log(`       Invalid ext.`)
                    return res;
                }
                var dbCID = await db.collection("cid").findOne({cid: cid})
                if(dbCID !== null){
                    console.log(`   ${u} cid already exits.`)
                    return res;
                }
                res.subCIDs.push(cid)
                
                switch(i){
                    case 0: res.content.image = u; break;
                    case 1: res.content.audio = u; break;
                    case 2: res.content.video = u; break;
                    case 3: res.content.model = u; break;
                }
            }
            i++;
        }
    
        res.status = true;
        return res;
    }

    app.post("/host", async (req, res) =>{
        console.log("Attempting Host Request...")

        req.pipe(req.busboy);

        var contract;

        var baseURI;

        var subURIs = [];

        var files = [];

        var success = true;

        count = 0;
        
        failed = (file, msg) =>{
            console.log(msg)
            file.resume();
            success = false;
        }
        
        req.busboy.on('file', async (name, file, info) =>{
            count++;
            console.log(`   name: ${name} info: ${info.mimeType}`);
            try{

                if(name.substring(0,7) !== "ipfs://"){
                    failed(file,`   Invalid uri format.`)
                    return;
                }
                
                var cid;
                var filename = null;

                if(!name.includes("?filename=")){
                    cid = name.replace("ipfs://", "")
                }
                else{
                    cid = name.replace("ipfs://", "").split("?filename=");
                    if(cid.length !== 2){
                        failed(file, `  Invalid sub uri format`)
                        return;
                    }
                    filename = cid[1];
                    cid = cid[0];
                }

                console.log(`   parsed cid: ${cid}`);

                console.log(`   parsed filename: ${filename}`);

                var dbCID = await db.collection("cid").findOne({cid: cid});
                console.log(`   dbCID: ${JSON.stringify(dbCID, null, 4)}.`);

                //console.log(file)
                if(dbCID === null){
                    failed(file, `   dbCID was null.`);
                    return;
                }

                console.log(`   dbCID state: ${dbCID.state}`);
                if(dbCID.state !== "verified"){
                    failed(file, `   dbCID already analyzed`);
                    return;
                }

                // Mime Parsing Section.
                var file_mime = null;
    
                if(filename === null){
                    console.log("   detecting baseURI in host request");
                    var baseURIdb = await db.collection("nft").findOne({baseURI: name})
                    if(mime.extension(info.mimeType) !== "json" || baseURIdb === null){
                        failed(file, "  Invalid uri format given. (no filename)")
                        return;
                    }
                    file_mime = {ext: "json", mime: "application/json"};
                }
                else{
                    file_mime = mime_kind(filename);
                }

                if(file_mime === null){
                    failed(file, `   File format TYPE incorrect.`);
                    return;
                }

                var info_ext = mime.extension(info.mimeType);

                console.log(`   ext: ${info_ext}`)

                var ext;

                if(!uri_ext.includes(info_ext) || info_ext !== file_mime.ext){
                    failed(file, "   Invalid file type1")
                    return;
                }
                ext = info_ext;
                
                // Parsing done push name to files.
                files.push(name);
                
                console.log(`   writing file: ${name}`);
                const fstream = fs.createWriteStream(path.join(uploadPath, cid + "." + ext));
                file.pipe(fstream);

                fstream.on('close', async () => {
                    console.log(`   Upload of '${name}' finished, `);

                    count--;

                    if(count === 0){
                        // TODO wait for contract field to complete?
                        console.log(` closing... success: ${success}`);

                        if(!success){
                            res.status(400).json({status: "failed", reason: "data error"})
                            return;
                        }

                        if(files.length != subURIs.length + 1){
                            console.log(`   Invalid Files number`)
                            res.status(400).json({status: "failed", reason: `Invalid number of files vs subURIs`})
                            return;
                        }
            
                        if(!files.includes(baseURI)){
                            console.log(`   baseURI: ${baseURI} not included.`)
                            res.status(400).json({status: "failed", reason: `baseURI: ${baseURI} not included.`})
                            return;
                        }
            
                        for(var u of subURIs){
                            if(!files.includes(u)){
                                console.log(` subURI: ${u} not included.`)
                                res.status(400).json({status: "failed", reason: ` subURI: ${u} not included.`})
                                return;
                            }
                        }

                        for(var f of files){
                            var cid = f.replace("ipfs://", "").split("?filename=");
                            var ext;
                            if(cid.length == 2){
                                ext = mime_kind(cid[1]).ext;
                                cid = cid[0]
                                console.log(`suburi ext: ${ext} `);
                            }
                            else{
                                console.log("base uri json")
                                ext = "json";
                            }
                            console.log(`UPLOADED: ${cid}`)
                            await db.collection("cid").updateOne({cid: cid}, {$set: {state: "uploaded", ext: ext}})
                        }

                        await db.collection("nft").updateOne({contract: contract}, {$set: {state: "uploaded"}})
                        
                        res.status(200).json({status: "success"})
                        return;
                    }
                })
            }
            catch{
                console.log("   uri error.")
            }
        })

        req.busboy.on('field', async (fieldname, value) =>{

            console.log(`   fieldname: ${fieldname} value: ${value}`);
            if(fieldname !== 'contract'){
                console.log(`   Invalid field name`);
                success = false;
                return;
            }

            if(!web3.utils.isAddress(value)){
                console.log(` Invalid contract address given.`)
                success = false;
                return;
            }

            var nft = await db.collection('nft').findOne({contract: value});

            console.log(nft);

            if(nft === null || nft.state !== 'verified'){
                console.log(`   Invalid contract query.`);
                success = false;
                return;
            }

            baseURI = nft.baseURI;

            console.log(`       baseURI: ${baseURI}`);

            // TODO subURI parse.
            for(var c in nft.content){
                console.log(`       subURI: ${nft.content[c]}`);
                subURIs.push(nft.content[c]);
            }
            contract = value;

            console.log(`   HOST contract: ${contract}`)
        })

    })
}

module.exports = routes
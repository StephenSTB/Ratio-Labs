const CID = require('multiformats/cid').CID
const path = require('path');  
const fs = require("fs-extra");

const mime = require('mime-types')

const uploadPath = path.join(__dirname, 'gatenft/'); // Register the upload path
fs.ensureDir(uploadPath); // Make sure that he upload path exits

routes = (app, db, ipfs, web3) =>{
    app.get("/", (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send({greet: "Welcome to oracle. 3001"})
        console.log("Pinged")
    })

    app.get("/state", async (req, res) =>{

        console.log(`\nContract state query:`)

        var contract = req.query.contract;

        if(contract === undefined || contract === null || !web3.utils.isAddress(contract)){
            res.status(400).json({"status": "failed", "reason": "Invalid contract address format."})
        }

        var data =  await db.collection("nft").findOne({contract: contract});

        if(data === null || data === undefined){
            res.status(400).json({"status": "failed", "reason": "Invalid nft status."})
        }

        console.log(`   ${contract} state: ${data.state}`)

        res.status(200).json({status: "success", state: data.state});

    });
    
    app.post("/verify", async (req, res) =>{

        console.log("\nNFT verificaiton POST.")
        var body = req.body;
        var content = body.content
        var contract = content.contract;
        var distributor = content.distributor;
        var signature = body.signature;
        /*
        console.log("body:")
        console.log(body)
        console.log("content: ");
        console.log( content)*/
        if(req.body === undefined || content === undefined || contract === undefined || distributor === undefined || signature === undefined || content.name === undefined ){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft given"})
            return;
        }
        if(req.body === null || content === null || contract === null || distributor === null || signature === null || content.name === undefined){
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

        var data;

        try{
            data = await db.collection("nft").findOne({contract: contract});
            console.log(`   Data: ${JSON.stringify(data)}`);
        }
        catch(err){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft verification query.`})
            return;
        }

        if(data === null){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft verification contract.`})
            return;
        }

        if(data.state !== 'new'){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft status`})
            return;
        }

        if(data.distributor !== distributor){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft distributor was ${distributor}`})
            return;
        }
        //console.log(req.body)

        var baseCID;

        try{
            console.log("   Base URI size:" + Buffer.from(JSON.stringify(req.body)).length)
            baseCID = await ipfs.add(JSON.stringify(req.body));
        }
        catch(err){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft body`})
            return
        }
        console.log(`   Base cid: ${baseCID.cid}`);
        
        //console.log(data.baseURI.replace("ipfs://", ""))

        if(data.baseURI.replace("ipfs://", "") !== baseCID.cid.toString()){
            res.status(400).json({"status": "Failed", "reason": `Invalid nft cid ${baseCID.cid.toString()}`})
            return
        }

        var baseURI = data.baseURI;

        var uriExists = await db.collection("uri").findOne({uri: baseURI})

        console.log("   URI Exists: " + uriExists);

        if(uriExists !== null){
            res.status(400).json({"status": "Failed", "reason": `Invalid base uri (already verified).`})
            return;
        }

        var result = await validateURIs(content);

        console.log(`   Sub URIs Valid: ${JSON.stringify(result)}`)

        if(result.status !== true){
            res.status(400).json({"status": "Failed", "reason": "Invalid nft content given."})
            return;
        }

        var subURIs = result.main;

        try{
            var hash =  web3.utils.sha3(JSON.stringify(content))

            verifySigner = web3.eth.accounts.recover(hash, signature)

            console.log(`   Signer: ${verifySigner}`)

            if(verifySigner.toString() !== distributor){
                res.status(400).json({"status": "Failed", "reason": "Invalid nft signature."})
                return
            }

            //console.log(subURIs[0])

            await db.collection("uri").insertOne({uri: data.baseURI, hosted: false});
            
            for(var u of subURIs){
                console.log(`   subURI: ${u}`)
                await db.collection("uri").insertOne({uri: u, hosted: false});
            }

            var updated = await db.collection("nft").updateOne({contract: contract}, {$set: {state: "verified", content: result.content}})
            //console.log(`   updated: ${JSON.stringify(updated)}`)

            updated = await db.collection("nft").findOne({contract: contract})
            console.log(`   updated: ${JSON.stringify(updated)}\n`)

        }catch{
            res.status(400).json({"status": "Failed", "reason": `Invalid nft`})
            return
        }
    
        res.status(200).json({status: "success"})
        //console.log("verify ping")
    })

    validateURIs =  async (content) =>{

        var main = [content.image, content.audio, content.video, content.model] 
        var res = {status: false, main: [], content: {}}
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
                    console.log(`   ${a} already exits.`)
                    return res;
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

    app.post("/host", async (req, res) =>{
        console.log("Attempting Host Request...")

        req.pipe(req.busboy);

        var contract;

        var baseURI;

        var subURIs = [];

        var files = [];

        var success = true;

        count = 0;
        
        req.busboy.on('file', async (name, file, info) =>{
            console.log(`   name: ${name} info: ${info.mimeType}`);
            count++;
            try{
                var data = await db.collection("uri").findOne({uri: name});
                console.log(`   uri data: ${data}.`);
                if(data === null){
                    console.log(`   uri data was null.`)
                    file.resume();
                    success = false;
                    return;
                }
                console.log(`   uri hosted: ${data.hosted}.`);
                if(data.hosted){
                    console.log(`   uri data already hosted.`);
                    file.resume();
                    success = false;
                    return;
                }

                var cid = (await ipfs.add(file)).cid.toString();

                if(cid !== name.replace("ipfs://", "")){
                    console.log(`   file cid does not match name.`);
                    file.resume();
                    success = false;
                    return;
                }

                files.push(name);

                var ext = mime.extension(info.mimeType);
                console.log(`   ext: ${ext}`)
                
                console.log(`   writing file: ${name}`);
                const fstream = fs.createWriteStream(path.join(uploadPath, name.replace("ipfs://", "") + "." + ext));
                file.pipe(fstream);
                fstream.on('close', async () => {
                    console.log(`   Upload of '${name}' finished, `);
                    var pin = await ipfs.pin.add(CID.parse(cid))
                    console.log(`   ${pin} was pinned!`)

                    await db.collection("uri").updateOne({uri: name.replace("ipfs://", "")}, {$set: {hosted: true}})

                    count --;

                    if(count === 0){
                        console.log(` closing... success: ${success}`);

                        if(!success){
                            res.status(400).json({status: "failed"})
                            return;
                        }
            
                        if(!files.includes(baseURI)){
                            console.log(`   baseURI: ${baseURI} not included.`)
                            res.status(400).json({status: "failed"})
                            return;
                        }
            
                        for(var u of subURIs){
                            if(!files.includes(u)){
                                console.log(` subURI: ${u} not included.`)
                                res.status(400).json({status: "failed"})
                                return;
                            }
                        }
                        await db.collection("nft").updateOne({contract: contract}, {$set: {state: "hosted"}})
                        
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

            console.log(`   baseURI: ${baseURI}`);

            for(var c in nft.content){
                console.log(`   subURI: ${nft.content[c]}`);
                subURIs.push(nft.content[c]);
            }
            contract = value;

            console.log(`   contract: ${contract}`)
        })
    })
}

module.exports = routes
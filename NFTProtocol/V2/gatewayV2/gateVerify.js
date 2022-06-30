const { CID } = require('multiformats');

const uint8arrays = require('uint8arrays');

const all = require("it-all");

const fs = require("fs");

gateVerify = async (db, ipfs, nftProtocol) =>{

    nftProtocol.verificationRequest().on('data', async (event) => {
        
        //console.log("event:" + event.returnValues)
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block
        var baseCID = baseURI.replace("ipfs://", "");

        try{
            CID.parse(baseCID)
        }
        catch(err){
            console.log("Invalid base cid in request")
            return;
        }

        console.log('\x1b[36m%s\x1b[0m',`Verifiaction Request: \n   { contract: ${contract}, distributor: ${distributor}, baseCID: ${baseCID}  block: ${block} }` );
        
        await db.collection("nft").insertOne({contract: contract, distributor: distributor, 
            baseURI: baseURI, baseCID: baseCID, state: "new", block: block
        })
    
    });

    nftProtocol.blockSubmitted().on('data', async (event) =>{
        var block = event.returnValues._block;

        // Get leaves
        
        while(true){
            try{

                var leavesArr = uint8arrays.concat(await all(await ipfs.cat(block._leaves, {timeout: 2000})));

                var leavesDecode = new TextDecoder().decode(leavesArr).toString();

                var leaves = JSON.parse(leavesDecode);

                //console.log("leaves obj:")
                //console.log(leaves);

                fs.writeFile(__dirname + "/leaves/" + block._leaves + ".json", JSON.stringify(leaves, null, 4), (e) =>{
                    if(e){
                        console.log(e)
                    }
                })
                console.log(`Block Retrieved:\n { root: ${block._root}, leaves: ${block._leaves} }`);
                break;

            }catch(e){
                console.log(e)
            }
            await new Promise(p => setTimeout(p, 2000))
        }
        
    })

   
}

module.exports = gateVerify
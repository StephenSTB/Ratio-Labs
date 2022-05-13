
const fs = require('fs');

const ganache = require('ganache');

const contract = require('@truffle/contract');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const { CID } = require('multiformats');

const NFTProtocol = contract(require('../../../src/contracts/NFTProtocol.json'));

var nftProtocol;

gateVerify = async (db, web3, ipfs) =>{

    var provider = await web3.eth.currentProvider;

    var chainId = await web3.eth.getChainId();

    var providerName = networkData[chainId].chainName;

    console.log(await web3.eth.getChainId())

    await NFTProtocol.setProvider(provider);

    console.log(`NFTProtocol Address: ${deployedContracts[providerName].NFTProtocol.address}`)

    nftProtocol = await NFTProtocol.at(deployedContracts[providerName].NFTProtocol.address);

    nftProtocol.verificationRequest().on('data', async (event) => {
        
        //console.log("event:" + event.returnValues)
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var baseURI = event.returnValues._baseURI;
        var block = event.returnValues._block

        console.log(`Verifiaction Request -- contract: ${contract}, distributor: ${distributor}, 
                                             baseURI: ${baseURI}, block: ${block}` );
        
        await db.collection("nft").insertOne({contract: contract, distributor: distributor, 
            baseURI: baseURI, state: "new", block: block
        })  

        //console.log(insert)
    
    });

    hostCIDs = async () =>{
        var uploadedCIDs = await db.collection("cid").find({state: "uploaded"}).toArray();

        console.log(`   Hosting Uploaded URIs...`)

        console.log(`   Uploaded URIs: ${uploadedCIDs}`);

        if(uploadedCIDs.length > 0){
            for(var u of uploadedCIDs){

                console.log(`   Validating CID for ${u.cid}`);
                var cid = u.cid;
                try{
                    console.log(`   File path: `+ __dirname  + "/gatenft/" + cid + '.' +  u.ext)
                    
                    var file = fs.readFileSync(__dirname + "/gatenft/" + cid + '.' +  u.ext, (err) =>{
                        if(err) console.log(err);
                    })
    
                    //console.log(`   file: \n${file}`);
    
                    var add = await ipfs.add(file);
    
                    console.log(`   add cid: ${add.cid.toString()}`)
    
                    if(add.cid.toString() !== cid){
                        console.log(`   cids dont match: ${add.cid.toString()} : ${cid}`    )
                        await db.collection("cid").updateOne({cid: u.cid}, {$set: {state: "rejected"}})
                        await fs.unlink(__dirname + "/gatenft/" + cid + '.' +  u.ext, (err) =>{ 
                            if(err) console.log(err);
                        });
                        continue;
                    }
                    console.log("   CIDs match. ADDING CID TO IPFS")
                    await ipfs.pin.add(CID.parse(add.cid.toString()));
                    await db.collection("cid").updateOne({cid: u.cid}, {$set: {state: "hosted"}})
                }catch{ console.log("   file error.") }
            }
        }
        return;
    }

    hostNFT = async () =>{
        var uploadedNFTs = await db.collection('nft').find({state: "uploaded"}).toArray();

        console.log(`   Hosting Uploaded NFTs...`)

        console.log(`   Uploaded NFTs: ${uploadedNFTs}`);

        for(var u of uploadedNFTs){
            var contract = u.contract;
            var content = u.content;

            var host = true;

            // evaluate baseURI
            var baseCID = u.baseURI.replace("ipfs://", "");

            for(var c in content){
                console.log(`   subURI: ${content[c]}`)
                console.log(`       CID: ${(content[c].replace("ipfs://", "")).split("?filename=")[0]}`)
                var dbCID = await db.collection("cid").findOne({cid: (content[c].replace("ipfs://", "").split("?filename="))[0]});

                console.log(`   dbCID: ${JSON.stringify(dbCID, null, 4)}`);

                if(dbCID.state == "uploaded"){
                    console.log("NFT IS UPLOADED")
                    host = false;
                    break;
                }
                if(dbCID.state === "hosted"){
                    console.log("NFT HOSTED")
                    continue;
                }
                if(dbCID.state === "rejected"){
                    console.log("NFT REJECTED.")
                    await db.collection("nft").updateOne({contract: contract}, {$set: {state: "rejected"}})
                    host = false;
                    break;
                }
            }
            if(host){
                await db.collection("nft").updateOne({contract: contract}, {$set: {state: "hosted"}});
                console.log(`   ${contract} <-> ${u.baseURI} HOSTED!`);
            }
        }
        return;
    }

    // Handle nft hosting post upload;
    while(true){
        await hostCIDs();

        await hostNFT();

        await new Promise(p => setTimeout(p, 10000));
    }
   
}

module.exports = gateVerify
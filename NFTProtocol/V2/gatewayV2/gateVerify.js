
const fs = require('fs');

const ganache = require('ganache');

const contract = require('@truffle/contract');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const { CID } = require('multiformats');

const NFTProtocol = contract(require('../../../src/contracts/NFTProtocol.json'));

var nftProtocol;

gateVerify = async (db, web3) =>{

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
        var baseCID = baseURI.replace("ipfs://", "");

        try{
            CID.parse(baseCID)
        }
        catch(err){
            console.log("Invalid base cid in request")
            return;
        }

        console.log(`Verifiaction Request -- contract: ${contract}, distributor: ${distributor}, 
                                             baseURI: ${baseURI}, baseCID: ${baseCID} block: ${block}` );
        
        await db.collection("nft").insertOne({contract: contract, distributor: distributor, 
            baseURI: baseURI, baseCID: baseCID, state: "new", block: block
        })
    
    });

   
}

module.exports = gateVerify
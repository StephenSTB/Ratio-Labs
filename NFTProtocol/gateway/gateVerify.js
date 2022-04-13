

const ganache = require('ganache');

const contract = require('@truffle/contract');

const deployedContracts = require('../../src/data/Deployed_Contracts.json');

const networkData = require('../../src/data/Network_Data.json');

const ProtocolNFT = contract(require('../../src/contracts/ProtocolNFT.json'));

var protocolNFT;

gateVerify = async (db, web3) =>{

    var provider = await web3.eth.currentProvider;

    var chainId = await web3.eth.getChainId();

    var providerName = networkData[chainId].chainName;

    console.log(await web3.eth.getChainId())

    await ProtocolNFT.setProvider(provider);

    console.log(`ProtocolNFT Address: ${deployedContracts[providerName].ProtocolNFT.address}`)

    protocolNFT = await ProtocolNFT.at(deployedContracts[providerName].ProtocolNFT.address);

    protocolNFT.verificationRequest().on('data', async (event) => {
        console.log(event.returnValues);
        //console.log("event:" + event.returnValues)
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var uri = event.returnValues._baseURI;

        var contractExists = await db.collection("nft").findOne({contract: contract})

        if(contractExists !== null){
            console.log("contract has already requested verification");
            return;
        }
        
        var insert = await db.collection("nft").insertOne({contract: contract, distributor: distributor, 
            baseURI: uri, state: "new", block: event.returnValues._block, 
        })  

        console.log(insert)
    
    });
   
}

module.exports = gateVerify
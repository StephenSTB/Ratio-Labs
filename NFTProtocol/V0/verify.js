

const ganache = require('ganache');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const contract = require('@truffle/contract');

const { MerkleTree } = require('merkletreejs')

const deployedContracts = require('../../src/data/Deployed_Contracts.json');

const keccak256 = require('keccak256');

const ProtocolNFT = contract(require('../../src/contracts/ProtocolNFT.json'));

var protocolNFT;


verify = async (db, provider, providerName, web3) =>{

    var wallet = web3.eth.accounts.wallet;

    var account = wallet["4"].address;

    //console.log(account)

    await ProtocolNFT.setProvider(provider);

    await ProtocolNFT.setWallet(web3.eth.accounts.wallet);

    await ProtocolNFT.defaults({from: account});

    console.log(`ProtocolNFT Address: ${deployedContracts[providerName].ProtocolNFT.address}`)

    protocolNFT = await ProtocolNFT.at(deployedContracts[providerName].ProtocolNFT.address);
    
    var owner = await protocolNFT.owner();

    //console.log(owner);


    //console.log(ProtocolNFT)

    //var account = await web3.eth.getAccounts();

    //console.log(accounts);

    //console.log(protocolNFT)
    // Process requests.
    protocolNFT.verificationRequest().on('data', async (event) => {
        console.log(event.returnValues);
        //console.log("event:" + event.returnValues)
        var contract = event.returnValues._contract;
        var distributor = event.returnValues._distributor;
        var uri = event.returnValues._baseURI;
        
        var insert = await db.collection("nft").insertOne({contract: contract, distributor: distributor, 
                                        baseURI: uri, state: "new", block: event.returnValues._block, 
                                        value: event.returnValues._value})  

        //console.log("insert:" + {insert});
        /*
        console.log(insert)

        var data = await db.collection("nft").findOne({contract:contract});
        console.log(data)*/
         
    });

    var slot = 100;

    // Aggregate transactions.
    var targetBlock = await web3.eth.getBlockNumber() + slot;
    console.log(`Target Block: ${targetBlock}`);
    var blockNumber;
    setInterval(async() =>{
        blockNumber = await web3.eth.getBlockNumber();

        if(blockNumber < targetBlock){
            return;
        }
        console.log("Target Block: " + targetBlock + " Hit.");

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

        try{
           var receipt = await protocolNFT.submitRoot(root)
           console.log(`Submitted root: ${receipt.logs[0].args._root}`)
        }
        catch(err){
            console.log(err + "submitError")
        }       
        
        targetBlock += slot;
        
        //console.log(blockNumber)
    }, 10000)
   
}

module.exports = verify
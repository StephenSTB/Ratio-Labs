const contract = require('@truffle/contract');

const { MerkleTree } = require('merkletreejs');

const ipfs_http = require('ipfs-http-client');

var ipfs;

var IPFS = require('ipfs');

var ipfs0;

const Web3 = require('web3');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../../src/data/Providers.json');

const keccak256 = require('keccak256');
const {sync: mime_kind, async} = require('mime-kind');

var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers['Ganache'].url})

var web3 = new Web3(wallet);

var utils = web3.utils;

var BN = utils.BN;

const protocolAddress = deployedContracts.Ganache.NFTProtocol.address;

const NFTProtocol = contract(require('../../../src/contracts/NFTProtocol.json'));

const RatioSingleNFT = contract(require('../../../src/contracts/RatioSingleNFT.json'));

const BadSingleNFT = contract(require(`../../../src/contracts/BadSingleNFT.json`));

RatioSingleNFT.setProvider(wallet);

BadSingleNFT.setProvider(wallet);

NFTProtocol.setProvider(wallet);

var nftProtocol;

var accounts;

// MongoDB Declaration/ Initialization
var mongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/nftdb";

var db;

mongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, async (err, client) =>{
    if (err) throw err;
    //console.log("Database created!");
    db = await client.db("nftdb");
});

main = async () =>{
    console.log(`Starting NFT Protocol Testing...\n`)
    accounts = await web3.eth.getAccounts()
    console.log(`Accounts: \n${accounts[0]}\n`)

    ipfs = await ipfs_http.create('/ip4/127.0.0.1/tcp/5002/http');

    ipfs0 = await IPFS.create({repo: "nft-test", start: false})

    console.log(`NFTProtocol address: ${protocolAddress}`);

    nftProtocol = await NFTProtocol.at(protocolAddress)

    await mainTesting();
   
    process.exit(0);
}
main();

var dir = "./testfiles/";

var nftMap = 
{
    "nftParseError": {nft: "{nftParseError}" , files: [dir + "ETHCard.gif"]},
    
    "invalidSubURIs": {nft: {content: { name: "ETH Fake NFT"}}, files: [dir + "ETHCard.gif"]},
}

nftParseError = async() =>{

    console.log("NFT JSON parse error:")

    var nftInfo = nftMap["nftParseError"];

    var badnft = nftInfo.nft

    var contract = await RatioSingleNFT.new("nftParseError", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]})

    var addNFT = await ipfs.add(badnft);

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var log = await waitForError(contract.address);

    printError(log.error);
    
}

nftMap["contentFormatErrors"] = {nft: {content: { name: "ETH Fake NFT", image: "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif"}}, files: [dir + "ETHCard.gif"]};

contentFormatErrors = async() =>{
    
    console.log(`NFT content was undefined, null or an array. Must be JSON:`)
    console.log(`   content undefined:`)

    var noContentnft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    delete noContentnft.content;

    var contract = await RatioSingleNFT.new("noContent", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    var addNFT = await ipfs.add(JSON.stringify(noContentnft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var log = await waitForError(contract.address);

    printError(log.error);

    console.log("   content was null:")

    var nullContentnft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    nullContentnft.content = null;

    console.log()

    contract = await RatioSingleNFT.new("badContent", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    var addNFT = await ipfs.add(JSON.stringify(nullContentnft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(contract.address);

    printError(log.error);
    
    console.log("   content was array:")

    var arrContentnft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    arrContentnft.content = ["array", "0"];

    contract = await RatioSingleNFT.new("badContent", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    var addNFT = await ipfs.add(JSON.stringify(arrContentnft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(contract.address);

    printError(log.error);

    console.log("Invalid signature type:")

    var badSignft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    badSignft.signature = ["array", "0"];

    contract = await RatioSingleNFT.new("badSig", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    var addNFT = await ipfs.add(JSON.stringify(badSignft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(contract.address);

    printError(log.error);

    console.log("Invalid name type:")

    var badNamenft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    badNamenft.content.name = ["array", "0"];

    badNamenft.signature = "0xSig";

    contract = await RatioSingleNFT.new("badName", "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    var addNFT = await ipfs.add(JSON.stringify(badNamenft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(contract.address);

    printError(log.error);

    console.log("Invalid Main content:")

    var badContentnft = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    delete badContentnft.content.image;

    var createdNFT = await createNFT(0, badContentnft.content);

    //console.log(createdNFT.nft)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("Invalid contract in nft.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    var createdNFT = await createNFT(0, invalidNFT.content)

    createdNFT.nft.content.contract = "0xbadContract";

    var addNFT = await ipfs.add(JSON.stringify(createdNFT.nft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await createdNFT.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("Invalid distributor in nft.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    var createdNFT = await createNFT(0, invalidNFT.content)

    createdNFT.nft.content.distributor = accounts[2];

    var addNFT = await ipfs.add(JSON.stringify(createdNFT.nft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await createdNFT.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("Invalid signature in nft.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    var createdNFT = await createNFT(0, invalidNFT.content)

    createdNFT.nft.signature = "0xBadSig";

    var addNFT = await ipfs.add(JSON.stringify(createdNFT.nft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await createdNFT.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("Invalid signer in nft.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["contentFormatErrors"].nft));

    var createdNFT = await createNFT(0, invalidNFT.content)

    var contentHash = web3.utils.soliditySha3(JSON.stringify(createdNFT.nft.content))
    createdNFT.nft.signature  = await web3.eth.sign(contentHash, accounts[1])

    var addNFT = await ipfs.add(JSON.stringify(createdNFT.nft));

    var baseURI = "ipfs://" + addNFT.cid.toString()

    await createdNFT.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);
}


nftMap["invalidSubURIs"] = {nft: {content: { name: "ETH Fake NFT"}}, files: [dir + "ETHCard.gif"]}

invalidSubURIs = async () =>{

    console.log("Invalid subURI contents in NFT:");

    /*
    
    console.log("   Invalid subURI type:")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = ["array type"];

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("   Invalid subURI format (not ipfs:// prefix):")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = "QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);*/

    console.log("   nft already includes cid.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    invalidNFT.content.audio = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error);

    console.log("   nft invalid ext.")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.sol";

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error)
    
    console.log("   cid already validated:")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var createdNFT = await createNFT(0, invalidNFT.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    log = await waitForError(createdNFT.contract.address);

    printError(log.error)

}

slashNFT = async () =>{

    console.log("Slash NFT:")

    var invalidNFT = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));

    invalidNFT.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    var createdNFT1 = {};

    createdNFT1.contract = await RatioSingleNFT.new(invalidNFT.content.name, "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    createdNFT1.nft = JSON.parse(JSON.stringify(nftMap["invalidSubURIs"].nft));
    createdNFT1.nft.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";
    createdNFT1.nft.content.contract = createdNFT1.contract.address;
    createdNFT1.nft.content.distributor = accounts[0];

    var contentHash = web3.utils.soliditySha3(JSON.stringify(createdNFT1.nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[0])
    createdNFT1.nft.signature = signedContent;

    var cid = (await ipfs0.add(JSON.stringify(createdNFT1.nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    var nft1Block = (await createdNFT1.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    console.log(`   createdNFT1 at block: ${nft1Block} baseURI: ${baseURI} contract: ${createdNFT1.contract.address}`)

    var currentBlock = await web3.eth.getBlockNumber();

    while(currentBlock === nft1Block){
        console.log("   waiting for new block..")
        await new Promise(p => setTimeout(p, 2000))
        currentBlock = await web3.eth.getBlockNumber();
    }

    var createdNFT2 = await createNFT(0, invalidNFT.content)

    var nft2Block = (await createdNFT2.contract.setBaseURI(createdNFT2.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    console.log(`   createdNFT2 at block: ${nft2Block}, contract: ${createdNFT2.contract.address} with subURI to be slashed.`)

    var subCID = await ipfs.add(fs.readFileSync(nftMap["invalidSubURIs"].files[0]));

    console.log(`   sub CID: ${subCID.cid.toString()}`);

    var latestBlock = await waitForBlock();

    var addNFT = await ipfs.add(JSON.stringify(createdNFT1.nft))

    console.log(`   added createdNFT1 to ipfs, cid: ${addNFT.cid.toString()}`);

    log = await getSlashed(createdNFT2.contract.address);

    printError(`Slashed: ${log.slashed}`)

    var protocolSlashed = await nftProtocol.contract.methods.nftSlashed(createdNFT2.contract.address).call()

    printError(`Protocol slashed: ${protocolSlashed}`)

}

nftMap["slashTransaction"] = {nft: {content: { name: "slashTransaction", model: "ipfs://QmPv3bW8iFLJQAUUawCjJD6ciDbjzECKfFDvPEXczkbhvm?filename=ethereum.gltf"}}, files: [dir + "ethereum.gltf"]}

slashTransaction = async () =>{

    console.log("Slash nft in oracle transactions: ");

    var nftInfo = nftMap["slashTransaction"];

    var createdNFT1 = {}

    createdNFT1.contract = await RatioSingleNFT.new(nftInfo.nft.content.name, "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]});

    createdNFT1.nft = JSON.parse(JSON.stringify(nftInfo.nft));
    createdNFT1.nft.content.contract = createdNFT1.contract.address;
    createdNFT1.nft.content.distributor = accounts[0];

    var contentHash = web3.utils.soliditySha3(JSON.stringify(createdNFT1.nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[0])
    createdNFT1.nft.signature = signedContent;

    var cid = (await ipfs0.add(JSON.stringify(createdNFT1.nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    var nft1Block = (await createdNFT1.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;
    
    console.log(`   createdNFT1 at block: ${nft1Block} baseURI: ${baseURI} contract: ${createdNFT1.contract.address}`)

    var currentBlock = await web3.eth.getBlockNumber();

    while(currentBlock === nft1Block){
        console.log("   waiting for new block..")
        await new Promise(p => setTimeout(p, 2000))
        currentBlock = await web3.eth.getBlockNumber();
    }

    var createdNFT2 = await createNFT(0, nftInfo.nft.content)

    var nft2Block = (await createdNFT2.contract.setBaseURI(createdNFT2.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    console.log(`   createdNFT2 at block: ${nft2Block}, contract: ${createdNFT2.contract.address} with subURI to be slashed.`)

    var currentBlock = await web3.eth.getBlockNumber();

    while(nft2Block + 5 >= currentBlock){
        console.log("   waiting for createdNFT2 to be added to transactions.")
        await new Promise(p => setTimeout(p, 2000))
        currentBlock = await web3.eth.getBlockNumber();
    }

    var subCID = await ipfs.add(fs.readFileSync(nftInfo.files[0]));

    console.log(`   sub CID: ${subCID.cid.toString()}`);

    var addNFT = await ipfs.add(JSON.stringify(createdNFT1.nft))

    console.log(`   added createdNFT1 to ipfs, cid: ${addNFT.cid.toString()}`);

    var log = await waitForError(createdNFT2.contract.address);

    printError(log.error)
}

nftMap["invalidFiles"] = {nft: {content: { name: "invalidFiles"}}, files: [dir + "camera.gltf", dir + "sample.pdf", dir + "PolyCard.gif"]}

invalidFiles = async() =>{

    console.log(`Invalid Files Tests: `)
    console.log(`   Invalid file type (not gltf in filename):`)

    var nftInfo = nftMap["invalidFiles"];

    var nft = JSON.parse(JSON.stringify(nftInfo.nft));

    nft.content.video = "ipfs://QmaqrK5myAvyDfPC7p7VrLSsYPHrXcH8JRDFWJ7R3PaFnn?filename=InvalidFile.ogg";

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})

    await ipfs.add(fs.readFileSync(nftInfo.files[0]));

    var log = await waitForError(createdNFT.contract.address);

    printError(log.error)

    console.log(`   Invalid file ext (ogg3):`)

    nft = JSON.parse(JSON.stringify(nftInfo.nft));

    nft.content.video = "ipfs://QmaNxbQNrJdLzzd8CKRutBjMZ6GXRjvuPepLuNSsfdeJRJ?filename=InvalidFile.ogg";

    createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})

    await ipfs.add(fs.readFileSync(nftInfo.files[1]));

    log = await waitForError(createdNFT.contract.address);

    printError(log.error)

    console.log(`   Invalid file type (file type doesn't match ext):`)

    nft = JSON.parse(JSON.stringify(nftInfo.nft));

    nft.content.video = "ipfs://QmPSmyxBAhRa5qckBcA7W5LtSF7bAnJ8p2Rs1DLn8FU7BZ?filename=InvalidFile.png";

    createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})

    await ipfs.add(fs.readFileSync(nftInfo.files[2]));

    log = await waitForError(createdNFT.contract.address);

    printError(log.error)
}

nftMap["nftParseReject"] = {nft: {content: {name:"rejectNFT", image: "ipfs://QmPSmyxBAhRa5qckBcA7W5LtSF7bAnJ8p2Rs1DLn8FU7BZ?filename=InvalidFile.png"}}}

nftParseReject = async () =>{

}

fileReject = async () => {
    
}

validNFT = async () =>{

}

mainTesting = async () => {

    //fileTest();

    //await nftParseError();
    //await contentFormatErrors();
    //await invalidSubURIs();
    //await slashNFT();
    //await slashTransaction()
    //await invalidFiles();

    //TODO: await nftParseReject();

}

createNFT = async(account, content) =>{
    var nft = {}

    var contract = await RatioSingleNFT.new(content.name, "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[account]});

    nft.content = content;
    nft.content.contract = contract.address;
    nft.content.distributor = accounts[account]

    var contentHash = web3.utils.soliditySha3(JSON.stringify(nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[account])
    nft.signature = signedContent;

    var cid = (await ipfs.add(JSON.stringify(nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    return {contract, nft, baseURI}
}

printError = (err) =>{
    console.log('\x1b[31m%s\x1b[0m', "  " + err)
}

waitForError = async (contract) =>{
    var log =  await db.collection("logs").findOne({contract});
    while(log === null){
        console.log("   waiting for error...");
        await new Promise(p => setTimeout(p, 2000));
        log =  await db.collection("logs").findOne({contract});
    }
    return log;
}

getSlashed = async (contract) =>{
    var log = await db.collection("logs").findOne({slashed: contract});
    while(log === null){
        console.log("   waiting for slashed contract...");
        await new Promise(p => setTimeout(p, 2000));
        log = await db.collection("logs").findOne({slashed: contract});
    }
    return log;
}

verifyNFT = async(account, nft, latestBlock, block) =>{
    console.log(`verifying nft2: ${nft.contract.address} : ${nft.baseURI}`);
    
    var subURIs = [nft.nft.content.image, nft.nft.content.audio, nft.nft.content.video, nft.nft.content.model];

    console.log(`nft subURIs pre parse: ${subURIs}`)

    for(var i = 0; i < subURIs.length; i++){
        if(subURIs[i] === undefined){
            subURIs.splice(i, 1);
            i--
        }
    }
    console.log(`nft subURIs post parse: ${subURIs}`)
    
    var leaf;
    switch(subURIs.length){
        case "1":
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], block)
            break;
        case "2":
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], block)
            break;
        case "3":
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], subURIs[2], block)
            break;
        case "4":
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], subURIs[2], subURIs[3], block)
            break;
    }

    if(latestBlock._leaves.includes(leaf)){
        console.log(`Leaf included..`)

        var tree = new MerkleTree(latestBlock._leaves, keccak256, {sort:true});

        var proof = tree.getHexProof(leaf);

        var nftStruct = {_contract: nft.contract.address, _distributor: nft.nft.content.distributor, _baseURI: nft.baseURI, _subURIs: subURIs, _block: block}

        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[account]});

        await viewContractState(nft.contract.address)
    }
}

waitForBlock = async() =>{
    var latestBlock = await nftProtocol.latestBlock();

    var curBlock = latestBlock;

    while(curBlock._block == latestBlock._block){
        console.log(`   waiting for new NFT Protocol block...`);
        await new Promise(p => setTimeout(p, 5000));
        curBlock = await nftProtocol.latestBlock();
    }
    return curBlock;
}

viewContractState = async (contractAddr) =>{
    console.log(`View protocol nft content for ${contractAddr}...`)

    // View contract nft
    var contract =  await nftProtocol.getContractNFT(contractAddr);

    console.log(`   contract nft: ${contract}`);

    var baseURIdistributor  = await nftProtocol.getBaseURIdistributor(contract._baseURI);

    console.log(`   baseURIdistributor: ${baseURIdistributor}`)

    if(contract._subURIs.length > 0){
        var subURIsBaseURI = await nftProtocol.getSubURIbaseURI(contract._subURIs[0]);

        console.log(`   subURIbaseURI: ${subURIsBaseURI}`);
    }

    // View distributor nft data
    var distributorContracts = await nftProtocol.getDistributorContracts(contract._distributor);

    console.log(`   distributor contracts: ${distributorContracts}\n`)
}

fileTest = () =>{

    var fileMime = mime_kind(fs.readFileSync(dir + "sample.pdf"))

    console.log("expect pdf: " + JSON.stringify(fileMime));

    /*
    var fileMime = mime_kind(fs.readFileSync(dir + "fakefile.ogg3"))

    console.log("expect null: " + fileMime);

    fileMime = mime_kind("fakefile.ogg");

    console.log("expect ogg: " + JSON.stringify(fileMime));

    var uri_ext = ["jpg", "png", "gif", "svg", "mp3", "wav", "ogg", "mp4", "webm","glb", "gltf"];

    for(var e of uri_ext){
        fileMime = mime_kind("fakefile." + e);

        console.log(`expected ${e} : ${JSON.stringify(fileMime)}` );
    }
    console.log()

    var sampleFiles = [dir + "polygonSymbol.jpg", dir + "Ratio_Card_Base.png", dir + "PolyCard.gif", dir + "PolygonCardBase.svg", dir + "file_example.mp3",
                       dir + "file_example.wav", dir + "sample3.ogg", dir + "file_example.mp4", dir + "WebmFile.webm", dir + "PremierBall.glb", dir + "camera.gltf"];

    var u = 0;
    for(var f of sampleFiles){
        fileMime = mime_kind(fs.readFileSync(f));
        console.log(`expected ${uri_ext[u]} : ${JSON.stringify(fileMime)}`);
        u++
    }*/
    
}
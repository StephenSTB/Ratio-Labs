const contract = require('@truffle/contract');

const {sync: mime_kind, async} = require('mime-kind')

const file_type = import('file-type')

var FormData = require('form-data');

const { Readable} = require('stream');

const { MerkleTree } = require('merkletreejs');

const all = require("it-all");

const uint8arrays = require('uint8arrays');

const { CID } = require('multiformats');

//const ipfs_http = require('ipfs-http-client');

var ipfs; 

var ipfsAPI;

const Web3 = require('web3');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../../src/data/Providers.json');

const GatewayApi = require("./nftGatewayAPIaxiosV2.js");

const keccak256 = require('keccak256');

const gatewayApi = new GatewayApi("http://localhost:3002");

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

main = async () =>{
    console.log(`Starting NFT Protocol Testing...\n`)
    accounts = await web3.eth.getAccounts()
    console.log(`Accounts: \n${accounts[0]}\n`)

    const IPFS = await import('ipfs');

    ipfs = await IPFS.create({repo: "nft-test", start: false})
    /*
    fs.writeFileSync(__dirname + "/../drop.txt", "drop", (err)=>{
        if(err) console.log(err);
    })*/

    console.log(`NFTProtocol address: ${protocolAddress}`);

    nftProtocol = await NFTProtocol.at(protocolAddress)

    await mainTesting();
   
    process.exit(0);
}
main();

var dir = "./testfiles/"

var nftMap = new Map();

nftMap.set("noRequestInGate", { nft:  {content: { name: "Fake NFT", image:"fake.png", contract: "0xfake"}},files: [dir + "Ratio_Card_Base.png"]})

nftMap.set("notNewRequestInGate", {nft: {content: { name: "Ratio Fake NFT", image: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ?filename=Ratio_Card_Base.png"}}, files: [dir + "Ratio_Card_Base.png"]})

nftMap.set("nftParseError", {nft: {content: { name: "ETH Fake NFT", image: "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif"}}, files: [dir + "ETHCard.gif"]})

nftMap.set("contentFormatError", {nft: {content: { name: "ETH Fake NFT", image: "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif"}}, files: [dir + "ETHCard.gif"]})

nftMap.set("ipfsCIDerror", {nft: {content: { name: "ETH Fake NFT", image: "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif"}}, files: [dir + "ETHCard.gif"]})

nftMap.set("invalidSubURIs", {nft: {content: { name: "ETH Fake NFT"}}, files: [dir + "ETHCard.gif"]})

// don't use eth card now.

nftMap.set("invalidSigner", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg"}}, files: [dir + "PolygonCardBase.svg"]})

nftMap.set("invalidSignature", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg"}}, files: [dir + "PolygonCardBase.svg"]})

nftMap.set("invalidFileExt", {nft: { content:{name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg"}}, files: [dir + "InvalidFile.txt"]})

nftMap.set("nftValidationTimeout", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg"}}, files: [dir + "PolygonCardBase.svg"]})

nftMap.set("filenameCIDnotFileCID", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg"}}, files: [dir + "ethereum.gltf"]})

nftMap.set("notAllFilesIncluded", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg", model: "ipfs://QmPv3bW8iFLJQAUUawCjJD6ciDbjzECKfFDvPEXczkbhvm?filename=ethereum.gltf"}}, files: [dir + "ethereum.gltf"]});

nftMap.set("validNFT", {nft: {content: {name: "PolyCard", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg", model: "ipfs://QmPv3bW8iFLJQAUUawCjJD6ciDbjzECKfFDvPEXczkbhvm?filename=ethereum.gltf"}}, files: [dir + "PolygonCardBase.svg", dir + "ethereum.gltf"]})

// contract/nft field Error tests
noRequestInGate = async () =>{

    console.log(`No Request with contract 0xfake Test:`)

    var nftInfo = nftMap.get("noRequestInGate")

    var form = new FormData();

    form.append(nftInfo.nft.content.contract, JSON.stringify(nftInfo.nft.content))

    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)} \n`);
}

notNewRequestInGate = async () =>{

    //console.log(JSON.stringify(nftMap.get("notNewRequestInGate").nft.content));

    var nftInfo = nftMap.get("notNewRequestInGate")

    var createdNFT = await createNFT(0, nftInfo.nft.content)

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    //console.log(nftInfo.files);

    await gateVerify(createdNFT, nftInfo.files)

    console.log(`Request with contract ${createdNFT.contract.address} already Exists Test:`)

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))

    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}\n`);
}

nftParseError = async () =>{

    var nftInfo = nftMap.get("nftParseError");

    var createdNFT = await createNFT(0, nftInfo.nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var state = await gatewayApi.state(createdNFT.contract.address);

    //console.log(state.data)

    console.log(`Request with non JSON nft string:`);

    var badNFTString = "{nft}";

    var form = new FormData();

    form.append(createdNFT.contract.address, badNFTString)

    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

// validateNFT tests

contentFormatError = async () =>{

    var nftInfo = nftMap.get("contentFormatError");

    var createdNFT = await createNFT(0, nftInfo.nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    console.log("Request with invalid nft contents:")

    console.log("   Invalid content:");

    var nftNoContent = JSON.parse(JSON.stringify(createdNFT.nft));

    //delete nftNoContent.content;

    nftNoContent.content = null;

    //console.log(createdNFT.nft)
    
    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftNoContent))

    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("   Invalid Signature:")

    var nftNoSignature = JSON.parse(JSON.stringify(createdNFT.nft));

    delete nftNoSignature.signature;

    //console.log(nftNoSignature)

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftNoSignature))

    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("Invalid name:");

    var nftNoName = JSON.parse(JSON.stringify(createdNFT.nft));

    delete nftNoName.content.name;

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftNoName))
    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("No subURIs Included:");

    var nftNoSubURIs = JSON.parse(JSON.stringify(createdNFT.nft));

    delete nftNoSubURIs.content.image;

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftNoSubURIs))
    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    /*

    console.log("Invalid subURI type:")

    var nftBadSubURI = JSON.parse(JSON.stringify(createdNFT.nft));

    nftBadSubURI.content.image = [];

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftBadSubURI))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);*/

    console.log("Invalid contract type:")

    var nftBadContract = JSON.parse(JSON.stringify(createdNFT.nft));

    //delete nftBadContract.content.contract;

    nftBadContract.content.contract = "0xFakeContract"

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftBadContract))
    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("Invalid distributor type:")

    var nftBadDistributor = JSON.parse(JSON.stringify(createdNFT.nft));

    delete nftBadDistributor.content.distributor;

    //nftBadDistrubutor.content.distributor = "0xFakeDistributor"

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftBadDistributor))
    form.append(nftInfo.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("Invalid contract/distributor")

    var nftBadCont = JSON.parse(JSON.stringify(createdNFT.nft));

    nftBadCont.content.contract = accounts[0]

    form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(nftBadCont))
    form.append(createdNFT.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    
}

nftBaseCIDnotIPFSCID = async () =>{

    console.log("Request with invalid given NFT CID:")

    var nftInfo = nftMap.get("ipfsCIDerror");

    var createdNFT = await createNFT(0, nftInfo.nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    createdNFT.nft.content.audio = "CIDbreaker";

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(createdNFT.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

invalidSubURIs = async () =>{
    console.log("Requests with invalid subURIs:")

    console.log("Invalid no ipfs:// format:")

    var nftInfo = nftMap.get("invalidSubURIs");

    var nftBadURIs = JSON.parse(JSON.stringify(nftInfo.nft))

    nftBadURIs.content.image = "ipfs://ETHCard.gif"

    var createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("Invalid subURI type:")

    nftBadURIs.content.image = [];

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("Invalid CID parse:");

    nftBadURIs.content.image = `ipfs://badcid?filename=badeth.gif`;

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("NFT already includes cid:")

    nftBadURIs.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    nftBadURIs.content.audio = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHaudio.wav"

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    delete nftBadURIs.content.audio

    console.log("Invalid file name ext:")

    nftBadURIs.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.sol";

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("sub CID already Exists:")

    nftBadURIs.content.image = "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif";

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.data)}`);

    createdNFT = await createNFT(0, nftBadURIs.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData()

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft))
    form.append(nftBadURIs.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

invalidSigner = async () =>{

    console.log("Request with Invalid Signer:");

    var nftInfo = nftMap.get("invalidSigner")

    var contract = await RatioSingleNFT.new(nftInfo.nft.content.name, "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[0]})

    var nft = nftInfo.nft;

    nft.content.contract = contract.address;
    nft.content.distributor = accounts[0];

    var contentHash = web3.utils.soliditySha3(JSON.stringify(nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[1])
    nft.signature = signedContent;

    //console.log(nft)

    //console.log(`account 0: ${accounts[0]}`)
    //console.log(`account 1: ${accounts[1]}`)

    var signer = await web3.eth.accounts.recover(contentHash, nft.signature)

    //console.log(`signer: ${signer}`);

    var cid = (await ipfs.add(JSON.stringify(nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    await contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(contract.address, JSON.stringify(nft));

    form.append(nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

invalidSignature = async () =>{
    console.log("Request with Invalid Signature:");

    var nftInfo = nftMap.get("invalidSignature")

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    createdNFT.nft.signature = "0xbadsig"

    var cid = (await ipfs.add(JSON.stringify(createdNFT.nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    await createdNFT.contract.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append(nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form)

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

/**
** Initial validate Files tests.
**/

nftValidationTimeout = async() =>{

    console.log("Request with Validation Timeout:")
    var nftInfo = nftMap.get("nftValidationTimeout");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);


}

invalidFileExt = async() =>{
    console.log("Request with Invalid file ext:")
    var nftInfo = nftMap.get("invalidFileExt");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append(createdNFT.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

invalidFilenameParse = async () =>{
    console.log("Request with Invalid filename parse:")
    var nftInfo = nftMap.get("nftValidationTimeout");

    console.log("   Invalid filename parse: no ?filename=")

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("badfilename", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("   Invalid filename parse: multiple breaks")

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://badipfs://filename?filename=1?filename=2", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

invalidFilenameMime = async () =>{

    console.log("Request with Invalid file mime:")

    var nftInfo = nftMap.get("nftValidationTimeout");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.sol", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

cidNotInNFT = async () =>{

    console.log("Request with Invalid file cid:")

    var nftInfo = nftMap.get("nftValidationTimeout");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBmYc2FQUM?filename=PloygonCardBase.svg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

// validate files function testing

filenameCIDnotFileCID = async () =>{

    console.log("Request with filename CID not matching file CID:")

    var nftInfo = nftMap.get("filenameCIDnotFileCID");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

// Redundent to cidNotInNFT?
cidNotInSubCIDs = async () =>{

    console.log("Request with CID not in subCIDs:")

    var nftInfo = nftMap.get("nftValidationTimeout");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg", fs.createReadStream(nftInfo.files[0]))
    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.svg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

notAllFilesIncluded = async () =>{
    console.log("Request with not all files included:")
    var nftInfo = nftMap.get("notAllFilesIncluded");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append(createdNFT.nft.content.model, fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

}

nftMap.set("filetypeNotnametype", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.png"}}, files: [dir + "polygonSymbol.jpg"]});

nftMap.set("filetypeNotNFTtype", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=RatioIcon00.ogg"}}, files: [dir + "RatioIcon00.svg"]})

nftMap.set("specialTypeCase", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmUd3Bx66grSNju92VV7FC4cDM2DnHoh9GZUHaogiceoTU?filename=sample3.ogg"}}, files: [dir + "sample3.ogg"]})

mimeMismatches = async () =>{
    console.log("Requests have mime mismatches:")
    console.log("   Request filetype is not the same as the nametype:");

    var nftInfo = nftMap.get("filetypeNotnametype");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=PloygonCardBase.png", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);

    console.log("   File mime not nft mime:")
    
    nftInfo = nftMap.get("filetypeNotNFTtype");

    nft = nftInfo.nft

    createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmNnvMYeWXN5trW5eQC8avTqVjZP8vYnxT7RBbmYc2FQUM?filename=RatioIcon00.svg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
     /*
    console.log("   Special type case:")
   
    nftInfo = nftMap.get("specialTypeCase");

    nft = nftInfo.nft

    createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmUd3Bx66grSNju92VV7FC4cDM2DnHoh9GZUHaogiceoTU?filename=sample3.ogg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);*/

}

nftMap.set("fileTypeInvalid", {nft: {content: {name: "PolyCard Invalid", image: "ipfs://QmYtY5LsFhTqFhkzTe9u5ejHZ2e4KRYbCnTg4UGAx52yne?filename=badsvg.jpg"}}, files: [dir + "badsvg"]})

fileTypeInvalid = async() =>{
    console.log("Request has file with invalid type: ");

    var nftInfo = nftMap.get("fileTypeInvalid");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append("ipfs://QmYtY5LsFhTqFhkzTe9u5ejHZ2e4KRYbCnTg4UGAx52yne?filename=badsvg.jpg", fs.createReadStream(nftInfo.files[0]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.response.data)}`);
}

validNFT = async () =>{

    console.log("Request which is valid:")
    var nftInfo = nftMap.get("validNFT");

    var nft = nftInfo.nft

    var createdNFT = await createNFT(0, nft.content);

    await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")});

    var form = new FormData();

    form.append(createdNFT.contract.address, JSON.stringify(createdNFT.nft));

    form.append(createdNFT.nft.content.image, fs.createReadStream(nftInfo.files[0]))

    form.append(createdNFT.nft.content.model, fs.createReadStream(nftInfo.files[1]))

    var verify = await gatewayApi.verify(form);

    console.log(`   ${JSON.stringify(verify.data)}`);

}

retrieveLeaves = async () =>{
    var leaves = (await nftProtocol.latestBlock())._leaves

    console.log(leaves)

    var leavesRequest = await gatewayApi.leaves(leaves);

    console.log(leavesRequest)

    console.log

}

mainTesting = async () =>{
    
   /* await noRequestInGate();

    await notNewRequestInGate();

    await nftParseError();

    await contentFormatError();

    await nftBaseCIDnotIPFSCID()

    await invalidSubURIs();

    await invalidSigner();

    await invalidSignature();

    await invalidFileExt();

    await nftValidationTimeout();

    await invalidFilenameParse();

    await invalidFilenameMime();

    await cidNotInNFT()

    await filenameCIDnotFileCID()

    await cidNotInSubCIDs()

    await notAllFilesIncluded()

    await mimeMismatches();

    await fileTypeInvalid();*/

    await retrieveLeaves()

    //await validNFT()
}

gateVerify = async (nftObj, files) =>{

    //console.log("   Gate Verification Request.")

    var nft = nftObj.nft;

    var form = new FormData();

    //console.log(JSON.stringify(nft))

    form.append(nft.content.contract, JSON.stringify(nft))

    for(var file of files){
        
        var type = mime_kind(file).mime;

        type = type.includes("image") ? "image" : type.includes("audio") ? "audio" : type.includes("video") ? "video" : type.includes("model") ? "model" : "error";

        //console.log(`   type: ${type}: name: ${nft.content[type]}`)

        form.append( nft.content[type], fs.createReadStream(file))
    }

    try{
       // console.log("   Getting nft state.")

        //console.log(nft.content.contract)

        var state = await gatewayApi.state(nft.content.contract);

        if(state.status !== 200){
            console.log(`   State retrive error.`);
            return
        }

        if(state.data.state !== "new"){
            console.log("   State was not verified.")
            return;
        }

        var verify = await gatewayApi.verify(form);
        
        if(verify.status !== 200){
            console.log(`   Unexpected host query failure Error: ${verify.data}`);
            return;
        }
        
        var state = await gatewayApi.state(nft.content.contract);

        if(state.status !== 200){
            console.log(`   State retrive error.`);
        }

        //console.log(`   nft state: ${JSON.stringify(state.data)}`)

        //return state.data.status;
    }
    catch(err){
        console.log("   Gate Verification Error")
    }
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
        console.log(`Waiting for new block...`);
        await new Promise(p => setTimeout(p, 5000));
        curBlock = await nftProtocol.latestBlock();
    }
    return curBlock;
}

viewContractState = async (contractAddr) =>{
    console.log(`View protocol nft content for ${contractAddr}...`)

    // View contract nft
    var contract =  await nftProtocol.getContractNFT(contractAddr);

    console.log(`contract nft: ${contract}`);

    var baseURIdistributor  = await nftProtocol.getBaseURIdistributor(contract._baseURI);

    console.log(`baseURIdistributor: ${baseURIdistributor}`)

    if(contract._subURIs.length > 0){
        var subURIsBaseURI = await nftProtocol.getSubURIbaseURI(contract._subURIs[0]);

        console.log(`subURIbaseURI: ${subURIsBaseURI}`);
    }

    // View distributor nft data
    var distributorContracts = await nftProtocol.getDistributorContracts(contract._distributor);

    console.log(`distributor contracts: ${distributorContracts}\n`)
}



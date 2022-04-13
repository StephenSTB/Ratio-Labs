const contract = require('@truffle/contract');

const async = require('mime-kind');

const IPFS = require('ipfs');

var ipfs; 

const Web3 = require('web3');

const deployedContracts = require('../../src/data/Deployed_Contracts.json');

const networkData = require('../../src/data/Network_Data.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../src/data/Providers.json');

const GatewayApi = require("../../src/components/NFT/nftGatewayAPI.js");

const gatewayApi = new GatewayApi("http://localhost:3001")

var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers['Ganache'].url})

var web3 = new Web3(wallet);

var utils = web3.utils;

const protocolAddress = deployedContracts.Ganache.ProtocolNFT.address;

const RatioNFT = contract(require('../../src/contracts/RatioNFT.json'));

RatioNFT.setProvider(wallet)

var accounts;

main = async () =>{
    console.log(`Starting NFT Protocol Testing...\n`)
    accounts = await web3.eth.getAccounts()
    console.log(`Accounts: \n${accounts[0]}\n`)

    ipfs = await IPFS.create({repo: "nft-test", start: false})

    await normalNFT();

    process.exit(1);
}
main();


// normal nft test.
normalNFT = async () =>{


    console.log(`Normal NFT Test...\n`);

    console.log(`   Creating Ratio NFT Contract.`)

    // Create NFT Contract
    var ratioNFT = await RatioNFT.new("Ratio Card", "RNFT", 1, 1, {from: accounts[0]});

    console.log(`   NFT address: ${ratioNFT.address}`);

    // Create NFT data

    var nftContent = {name: "Ratio Card", image: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"}

    nftContent.contract = ratioNFT.address;

    nftContent.distributor = accounts[0];

    var signedContent = await web3.eth.personal.sign(utils.sha3(JSON.stringify(nftContent)), accounts[0])

    var nft = {content: nftContent, signature: signedContent}

    console.log(`   Completed NFT:\n ${JSON.stringify(nft, null, 4)}\n`)

    // Create IPFS URI

    var cid = (await ipfs.add(JSON.stringify(nft))).cid;

    var baseURI = "ipfs://" + cid;

    console.log(`   NFT baseURI: ${baseURI}`);

    // Submit NFT baseURI

    await ratioNFT.setBaseURI(baseURI, true, protocolAddress, {from: this.props.account, value: web3.utils.toWei(".01", "ether")})

    // Send Verifcation Request

    // Send Status Request

    

    // Send Host Request;
}


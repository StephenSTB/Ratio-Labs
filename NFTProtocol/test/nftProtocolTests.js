const contract = require('@truffle/contract');

const {sync: mime_kind, async} = require('mime-kind')

var FormData = require('form-data');

const { Readable } = require('stream');

const { MerkleTree } = require('merkletreejs');

const IPFS = require('ipfs');

var ipfs; 

const Web3 = require('web3');

const deployedContracts = require('../../src/data/Deployed_Contracts.json');

const networkData = require('../../src/data/Network_Data.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../src/data/Providers.json');

const GatewayApi = require("./nftGatewayAPIaxios.js");
const keccak256 = require('keccak256');
const nftGatewayAPI = require('./nftGatewayAPIaxios.js');

const gatewayApi = new GatewayApi("http://localhost:3001")

var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers['Ganache'].url})

var web3 = new Web3(wallet);

var utils = web3.utils;

const protocolAddress = deployedContracts.Ganache.NFTProtocol.address;

const NFTProtocol = contract(require('../../src/contracts/NFTProtocol.json'));

const RatioSingleNFT = contract(require('../../src/contracts/RatioSingleNFT.json'));

const BadSingleNFT = contract(require(`../../src/contracts/BadSingleNFT.json`));

RatioSingleNFT.setProvider(wallet);

BadSingleNFT.setProvider(wallet);

NFTProtocol.setProvider(wallet);

var nftProtocol;

var accounts;

main = async () =>{
    console.log(`Starting NFT Protocol Testing...\n`)
    accounts = await web3.eth.getAccounts()
    console.log(`Accounts: \n${accounts[0]}\n`)

    ipfs = await IPFS.create({repo: "nft-test", start: false})

    fs.writeFileSync(__dirname + "/../drop.txt", "drop", (err)=>{
        if(err) console.log(err);
    })

    console.log(`NFTProtocol address: ${protocolAddress}`);

    nftProtocol = await NFTProtocol.at(protocolAddress)

    //await normalNFT();

    await nonHosting();

    process.exit(0);
}
main();

// normal nft test.
normalNFT = async () =>{

    console.log(`Normal NFT Test...\n`);

    console.log(`   Creating Ratio NFT Contract.`)

    // Create NFT Contract
    var ratioNFT = await RatioSingleNFT.new("Ratio Card", "RNFT", 1, 1, {from: accounts[0]});

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

    var nftBlock = (await ratioNFT.setBaseURI(baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    var latestBlock = await nftProtocol.latestBlock();

    // Send api status Request
    var state = await gatewayApi.state(ratioNFT.address);

    if(state.status !== 200){
        console.log(`   Unexpected state query failure`)
        return;
        //state = await gatewayApi.state(ratioNFT.address);
    }

    if(state.data.state !== 'new'){
        console.log(`   Invalid nft state was ${state.data.state}`)
        return
    }

    // Send api verify 
    
    console.log(`   Requesting NFT Verification via Gateway.`)

    var verify = await gatewayApi.verify(nft);

    if(verify.status !== 200){
        console.log(`   Verificaiton failed unexpetedly: ${verify.response.data.reason}`);
        return;
    }

    console.log(`   Verification: ${verify.data.status}`)

    // Send Host Request;

    var form = new FormData();

    var baseFile = Readable.from(JSON.stringify(nft));

    form.append(baseURI, baseFile, {filename: "nft.json", contentType: "application/json"})

    subFile = fs.createReadStream("./images/RatioCard/Ratio_Card_Base.png")

    form.append(nft.content.image, subFile)

    form.append('contract', nft.content.contract)
    
    //console.log(form)

    var host = await gatewayApi.host(form);
    
    if(host.status !== 200){
        console.log(`   Unexpected host query failure`);
        return;
    }

    console.log(`   Host: ${host.data.status}`)

    var state = await gatewayApi.state(ratioNFT.address);

    if(state.status !== 200){
        console.log(`   State retrive error.`);
    }

    console.log(`   nft state: ${JSON.stringify(state.data)}`)
   
    // Verifiy onchain

    console.log(`latestBlock: ${latestBlock._block}`);

    console.log(`nftBlock: ${nftBlock}`);

    var currentBlock = await nftProtocol.latestBlock();

    while(currentBlock._block === latestBlock._block){
        //console.log("waiting for new block...")
        await new Promise(p => setTimeout(p, 2000));
        currentBlock = await nftProtocol.latestBlock();
    }

    console.log(` current block: ${currentBlock}`)

    var leaf = utils.soliditySha3(ratioNFT.address, nft.content.distributor, baseURI, nft.content.image, nftBlock);

    if(currentBlock._leaves.includes(leaf)){

        console.log(`Leaf included..`)

        var tree = new MerkleTree(currentBlock._leaves, keccak256, {sort:true});

        var proof = tree.getHexProof(leaf);

        var nftStruct = {_contract: ratioNFT.address, _distributor: nft.content.distributor, _baseURI: baseURI, _subURIs: [nft.content.image], _block: nftBlock}

        await nftProtocol.verifyNFT(proof, currentBlock._root, leaf, nftStruct, {from: accounts[0]});

        await viewContractState(ratioNFT.address)
    }

    return;
}

// malicious subURI non hosting testing. oracle slashing.
nonHosting = async () =>{
    console.log("Creating NFTs...")
    var badCardURI = "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ";

    var nonHostNFT = await createNFT(1, badCardURI);

    console.log(`   Non hosted nft address: ${nonHostNFT.contract.address}`);

    var hostNFT = await createNFT(2, badCardURI);

    console.log(`   Hosted nft address: ${hostNFT.contract.address}`);

    var hostBlock = (await hostNFT.contract.setBaseURI(badCardURI, true, protocolAddress, {from: accounts[2], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    var status = await gateVerify(hostNFT.address, hostNFT.nft);

    console.log(`   Verification: ${status} `);
    /*
    subFile = fs.createReadStream("./images/RatioCard/RatioCardBase.png")

    status = await gateHost(hostNFT.nft, hostNFT.baseURI, subFile);

    console.log(`   Hosted: ${status}`)*/

    /*
    var latestBlock = await nftProtocol.latestBlock();

    var curBlock = latestBlock;

    while(curBlock._block == latestBlock._block){
        console.log(`Waiting for new block...`);
        await new Promise(p => setTimeout(p, 5000));
        curBlock = await nftProtocol.latestBlock();
    }

    console.log(`   Verifying Hosted nft...`)

    await verifyNFT(hostNFT, curBlock, hostBlock)*/
}


// malicious file hosting testing. gateway hosting hardening.
malFile = async () =>{

}

// public slashing test. NFTProtocol contract maintainance.
publicSlash = async () =>{

}


// Helper methods

//Helper methods.
createNFT = async (account, image, type) =>{

    var contract;
    if(type === null){
        contract = await RatioSingleNFT.new("RatioNFT", "RC", 1000000000, utils.toWei("1", "ether"), {from: accounts[account]});
    }
    else{
        contract = await BadSingleNFT.new("RatioNFT", "RC", 1000000000, utils.toWei("1", "ether"), {from: accounts[account]});
    }
    
    var distributor = await contract.contract.methods.distributor().call();

    console.log(`contract address: ${contract.address}, distributor: ${distributor}`);

    var nft = {}
    nft.content = {}
    nft.content.name = "RatioNFT";
    nft.content.image = image;
    nft.content.contract = contract.address;
    nft.content.distributor = distributor;

    console.log(`nft content: ${JSON.stringify(nft.content)}`);

    var contentHash = web3.utils.sha3(JSON.stringify(nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[account])
    nft.signature = signedContent;

    console.log(nft);

    var cid = (await ipfs.add(JSON.stringify(nft))).cid.toString();

    var baseURI = "ipfs://" + cid;
    return {contract, nft, baseURI}
}

verifyNFT = async (nft, latestBlock, block) =>{

    console.log(`verifying nft: ${nft.contract.address} : ${nft.baseURI}`)

    var leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, nft.nft.content.image, block)

    if(latestBlock._leaves.includes(leaf)){
        console.log(`Leaf included..`)

        var tree = new MerkleTree(latestBlock._leaves, keccak256, {sort:true});

        var proof = tree.getHexProof(leaf);

        var nftStruct = {_contract: nft.address, _distributor: nft.content.distributor, _baseURI: nft.baseURI, _subURIs: [nft.content.image], _block: block}

        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[0]});

        await viewContractState(nft.address)
    }

}

gateVerify = async (contractAddr, nft) =>{

    // Send api status Request
    var state = await gatewayApi.state(contractAddr);

    if(state.status !== 200){
        console.log(`   Unexpected state query failure`)
        return;
        //state = await gatewayApi.state(ratioNFT.address);
    }

    if(state.data.state !== 'new'){
        console.log(`   Invalid nft state was ${state.data.state}`)
        return
    }

    // Send api verify 
    
    console.log(`   Requesting NFT Verification via Gateway.`)

    var verify = await gatewayApi.verify(nft);

    if(verify.status !== 200){
        console.log(`   Verificaiton failed unexpetedly: ${verify.response.data.reason}`);
        return;
    }

    console.log(`   Verification: ${verify.data.status}`)

    return verify.data.status
}

gateHost = async(nft, baseURI, subFile) =>{

    // Send Host Request;

    var form = new FormData();

    var baseFile = Readable.from(JSON.stringify(nft));

    form.append(baseURI, baseFile, {filename: "nft.json", contentType: "application/json"})

    form.append(nft.content.image, subFile)

    form.append('contract', nft.content.contract)
    
    //console.log(form)

    var host = await gatewayApi.host(form);
    
    if(host.status !== 200){
        console.log(`   Unexpected host query failure`);
        return;
    }

    console.log(`   Host: ${host.data.status}`)

    var state = await gatewayApi.state(ratioNFT.address);

    if(state.status !== 200){
        console.log(`   State retrive error.`);
    }

    console.log(`   nft state: ${JSON.stringify(state.data)}`)

    return state.data.status
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

randomNFT = async () =>{
    /*fs.readdirSync('./dirpath', {withFileTypes: true})
    .filter(item => !item.isDirectory())
    .map(item => item.name)*/
}


const contract = require('@truffle/contract');

const {sync: mime_kind, async} = require('mime-kind')

const file_type = import('file-type')

var FormData = require('form-data');

const { Readable} = require('stream');

const { MerkleTree } = require('merkletreejs');

const all = require("it-all");

const uint8arrays = require('uint8arrays');

const IPFS = require('ipfs');

const ipfs_http = require('ipfs-http-client');

var ipfs; 

var ipfsAPI;

const Web3 = require('web3');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../../src/data/Providers.json');

const GatewayApi = require("./nftGatewayAPIaxiosV1.js");
const keccak256 = require('keccak256');

const gatewayApi = new GatewayApi("http://localhost:3002")

var wallet = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers['Ganache'].url})

var web3 = new Web3(wallet);

var utils = web3.utils;

var BN = utils.BN;

const { Blob } = require("buffer");
const { type } = require('os');

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

    ipfs = await IPFS.create({repo: "nft-test", start: false})

    fs.writeFileSync(__dirname + "/../drop.txt", "drop", (err)=>{
        if(err) console.log(err);
    })

    console.log(`NFTProtocol address: ${protocolAddress}`);

    nftProtocol = await NFTProtocol.at(protocolAddress)

    //await verification();

    //await normalNFT();

    //await nonHosting();

    //await staleNFT();

    //await malFile();

    await createNFTs();

    //await fileTesting();

    process.exit(0);
}
main();

fileTesting = async () =>{
    /*
    var file_t = await file_type;

    var file = fs.readFileSync("./images/PolygonCards/Card/Complete/Ten/Common/PolyCard_Ten_Common.gif")
    var type = await file_t.fileTypeFromBuffer(file);

    console.log(type)

    var type = mime_kind("RAndomFile.svg")

    console.log(type)*/

    await ipfs.start();

    
    var addFile =  await ipfs.add(fs.readFileSync("./images/PolygonCards/Card/Complete/Ten/Common/PolyCard_Ten_Common.gif")) //await ipfs.add("./models/ethereum_3d_logo/scene.gltf");

    console.log(addFile.cid.toString());

    var file = uint8arrays.concat(await all(ipfs.files.read("/ipfs/" + addFile.cid.toString(), {length: 100000000, timeout:2000})));

    console.log(file)

    var buf = Buffer.from(file);

    var mime = await (await file_type).fileTypeFromBuffer(buf);

    console.log(mime)

}

// Creating many nfts.
createNFTs = async () =>{

    console.log("Creating nfts")

    var contents = [/*{content: {name: "Ratio Card", image: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ?filename=Ratio_Base_Card.png"}, files:["./images/RatioCard/Ratio_Card_Base.png"]},*/ 
                    /*{content: {name: "Ratio Bad Card", image: "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ", audio:"ipfs://QmRGmpo7UGntccewabLQjRiKk7KvRxcrE7h5Qi5KbL3zm9"}, files: ["./images/RatioCard/RatioCardBase.png", "./sounds/game-success.wav"]},*/
                    /*{content: {name: "Poly Card Ten Common", image: "ipfs://Qmci4x92WCPfTM6ux53gDBzWU2nqcDg8Q9zt5E5SbvfW6G?filename=PolyCard_Ten_Common.gif", model: "ipfs://QmPv3bW8iFLJQAUUawCjJD6ciDbjzECKfFDvPEXczkbhvm?filename=ethereum_3d_logo.gltf"}, files: ["./images/PolygonCards/Card/Complete/Ten/Common/PolyCard_Ten_Common.gif", "./models/ethereum_3d_logo/scene.gltf"]}*/
                    {content: {name:"Ratio Card Base File", image: "ipfs://QmSGn7RUnUAMEua8QQveQbrAtzf5AvFAEXyfVM39ua1D92?filename=RatioCardBase.svg"}, files: ["./images/RatioCard/RatioCardBase.svg"]}
                    ]

    for(var c of contents){

        //console.log(`nft content: ${JSON.stringify(c, null, 4)}`)

        var createdNFT = await createNFT2(1, c.content);

        console.log(`baseURI nft: ${createdNFT.baseURI} contract address: ${createdNFT.contract.address} nft content: ${JSON.stringify(createdNFT.nft)}`)
        
        var block = (await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[1], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

        console.log(`request block: ${block}`);
        
        await gateVerify(createdNFT.contract.address, createdNFT.nft);
        
        await gateHost2(createdNFT.nft, createdNFT.baseURI, c.files);

        /*
        var latestBlock = await waitForBlock();

        await verifyNFT2(1, createdNFT, latestBlock, block)

        var nft = createdNFT.nft;

        await createdNFT.contract.setSubURIs(nft.content.image !== undefined ? nft.content.image : "" ,
                                             nft.content.audio !== undefined ? nft.content.audio : "" ,
                                             nft.content.vidoe !== undefined ? nft.content.video : "",
                                             nft.content.model !== undefined ? nft.content.model : "", {from: accounts[1]});

        var info = await createdNFT.contract.contract.methods.info().call();

        console.log(`info: ${JSON.stringify(info, null, 4)}`);*/
    }
}

verification = async () =>{
    console.log("Creating NFT...")
    var badCardURI = "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ";

    var nonHostNFT = await createNFT(1, badCardURI);

    var hostNFT = await createNFT(2, badCardURI);

    console.log(`   Non hosted nft address: ${nonHostNFT.contract.address}`);

    var nonHostBlock = nonHostNFT.contract.setBaseURI(nonHostNFT.baseURI, true, protocolAddress, {from: accounts[1], value: utils.toWei(".01", "ether")})

    //console.log(`nonHostBlock ${nonHostBlock}`);

    console.log(`   Hosted nft address: ${hostNFT.contract.address}`);

    var hostBlock = await hostNFT.contract.setBaseURI(hostNFT.baseURI, true, protocolAddress, {from: accounts[2], value: utils.toWei(".01", "ether")})

    //console.log(`   hostBlock: ${hostBlock}`);
}

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

    await ratioNFT.setSubURIs(nft.content.image, "", "", "", {from: accounts[0]});

    return;
}

// malicious subURI non hosting testing. oracle slashing.
nonHosting = async () =>{
    console.log("Creating NFTs...")

    var badCardURI = "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ";

    var nonHostNFT = await createNFT(1, badCardURI);

    console.log(`   Non hosted nft address: ${nonHostNFT.contract.address}`);

    var nonHostBlock = (await nonHostNFT.contract.setBaseURI(nonHostNFT.baseURI, true, protocolAddress, {from: accounts[1], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    var hostNFT = await createNFT(2, badCardURI);

    console.log(`   Hosted nft address: ${hostNFT.contract.address}`);

    var hostBlock = (await hostNFT.contract.setBaseURI(hostNFT.baseURI, true, protocolAddress, {from: accounts[2], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    console.log(`   hostBlock: ${hostBlock}`);

    var status = await gateVerify(hostNFT.contract.address, hostNFT.nft);

    subFile = fs.createReadStream("./images/RatioCard/RatioCardBase.png")

    status = await gateHost(hostNFT.nft, hostNFT.baseURI, subFile);

    console.log(`   Hosted: ${status}`)

    var curBlock = await waitForBlock();

    console.log(`   Verifying Hosted nft...`)

    await verifyNFT(2, hostNFT, curBlock, hostBlock)

    // host non hosted nft

    ipfsAPI = await ipfs_http.create('/ip4/127.0.0.1/tcp/5001');

    await ipfsAPI.add(JSON.stringify(nonHostNFT.nft))

    // verify non hosted nft

    curBlock = await waitForBlock();

    await verifyNFT(1, nonHostNFT, curBlock, nonHostBlock)

    // view contract state'

    var getNFT = await nftProtocol.getContractNFT(hostNFT.contract.address);

    while(getNFT._block !== '0'){
        console.log(`Waiting for slash...`);
        await new Promise(p => setTimeout(p, 5000))
        getNFT = await nftProtocol.getContractNFT(hostNFT.contract.address)
    }

   await viewContractState(hostNFT.contract.address)
}


staleNFT = async () =>{

    let polyCard = "ipfs://QmZnPekNP6pjdh2rL8sDa21eBpKaJtB3G1BzijtZKF76c1";

    var cardNFT = await createNFT(1, polyCard);

    var block = (await cardNFT.contract.setBaseURI(cardNFT.baseURI, true, protocolAddress, {from: accounts[1], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

}


// malicious file hosting testing. gateway hosting hardening.
malFile = async () =>{

    let polyCard = "ipfs://QmZnPekNP6pjdh2rL8sDa21eBpKaJtB3G1BzijtZKF76c1";

    var cardNFT = await createNFT(1, polyCard);

    var block = (await cardNFT.contract.setBaseURI(cardNFT.baseURI, true, protocolAddress, {from: accounts[1], value: utils.toWei(".01", "ether")})).receipt.blockNumber;

    var status = await gateVerify(cardNFT.contract.address, cardNFT.nft);

    subFile = fs.createReadStream("./images/RatioCard/RatioCardBase.png")

    status = await gateHost(cardNFT.nft, cardNFT.baseURI, subFile);

}

// public slashing test. NFTProtocol contract maintainance.
publicSlash = async () =>{

}

// Helper methods

//Helper methods.

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

createNFT2 = async(account, content) =>{
    var nft = {}

    var contract = await RatioSingleNFT.new(content.name, "RC", 10000, new BN(utils.toWei("1", "ether")), {from: accounts[account]});

    nft.content = content;
    nft.content.contract = contract.address;
    nft.content.distributor = accounts[account]

    var contentHash = web3.utils.sha3(JSON.stringify(nft.content))
    var signedContent = await web3.eth.sign(contentHash, accounts[account])
    nft.signature = signedContent;

    var cid = (await ipfs.add(JSON.stringify(nft))).cid.toString();

    var baseURI = "ipfs://" + cid;

    return {contract, nft, baseURI}
}


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

verifyNFT2 = async(account, nft, latestBlock, block) =>{
    console.log(`verifying nft2: ${nft.contract.address} : ${nft.baseURI}`);
    
    var subURIs = [nft.nft.content.image, nft.nft.content.audio, nft.nft.content.video, nft.nft.content.model];

    for(var i = 0; i < subURIs.length; i++){
        if(subURIs[i] === undefined){
            subURIs.splice(i, 1);
            i--
        }
    }

    console.log(`nft subURIs: ${subURIs}`)
    
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

        var nftStruct = {_contract: nft.content.contract, _distributor: nft.content.distributor, _baseURI: nft.baseURI, _subURIs: subURIs, _block: block}

        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[account]});

        await viewContractState(nft.content.contract)
    }
}

verifyNFT = async (account, nft, latestBlock, block) =>{

    console.log(`verifying nft: ${nft.contract.address} : ${nft.baseURI}`)

    var leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, nft.nft.content.image, block)

    if(latestBlock._leaves.includes(leaf)){
        console.log(`Leaf included..`)

        var tree = new MerkleTree(latestBlock._leaves, keccak256, {sort:true});

        var proof = tree.getHexProof(leaf);

        var nftStruct = {_contract: nft.contract.address, _distributor: nft.nft.content.distributor, _baseURI: nft.baseURI, _subURIs: [nft.nft.content.image], _block: block}

        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[account]});

        await viewContractState(nft.contract.address)
    }

}

gateVerify = async (contractAddr, nft) =>{

    // Send api status Request
    var state = await gatewayApi.state(contractAddr);

    while(state.status !== 200){
        console.log(`   Unexpected state query failure`)
        await new Promise(p => setTimeout(p, 5000))
        state = await gatewayApi.state(contractAddr);
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

    return verify.data
}

gateHost2 = async(nft, baseURI, subFiles) =>{
    var form = new FormData();

    // TODO: manipulate nft file to be invalid TEST.

    //nft.content.properties = [{"name" : "invaid prop", value: "invalid"}]

    //console.log(`   manipulated nft test: ${nft}`)

    var baseFile = Readable.from(JSON.stringify(nft));

    form.append('contract', nft.content.contract)

    form.append(baseURI, baseFile, {filename: "nft.json", contentType: "application/json"})

    for(var subfile of subFiles){
        
        var type = mime_kind(subfile).mime;

        type = type.includes("image") ? "image" : type.includes("audio") ? "audio" : type.includes("video") ? "video" : type.includes("model") ? "model" : "error";

        console.log(`   type: ${type}: name: ${nft.content[type]}`)

        form.append( nft.content[type], fs.createReadStream(subfile))
    }

    try{
        var state = await gatewayApi.state(nft.content.contract);

        if(state.status !== 200){
            console.log(`   State retrive error.`);
            return
        }

        if(state.data.state !== "verified"){
            console.log("   State was not verified.")
            return;
        }

        var host = await gatewayApi.host(form);

        //console.log(host)

        if(host.status !== 200){
            console.log(`   Unexpected host query failure`);
            return;
        }
        console.log(`   Host: ${host.data.status}`)

        var state = await gatewayApi.state(nft.content.contract);

        if(state.status !== 200){
            console.log(`   State retrive error.`);
        }

        console.log(`   nft state: ${JSON.stringify(state.data)}`)

        return state.data.status;
    }
    catch(err){
        console.log(err)
    }
    
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

    var state = await gatewayApi.state(nft.content.contract);

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


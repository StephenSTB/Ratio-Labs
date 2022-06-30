const contract = require('@truffle/contract');

const {sync: mime_kind, async} = require('mime-kind')

const file_type = import('file-type')

var FormData = require('form-data');

const { Readable} = require('stream');

const { MerkleTree } = require('merkletreejs');

const all = require("it-all");

const uint8arrays = require('uint8arrays');

const { CID } = require('multiformats');

var ipfs; 

var ipfsAPI;

const Web3 = require('web3');

const deployedContracts = require('../../../src/data/Deployed_Contracts.json');

const networkData = require('../../../src/data/Network_Data.json');

const keccak256 = require('keccak256');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

const providers = require('../../../src/data/Providers.json');

const GatewayApi = require("../V2/nftGatewayAPIaxiosV2.js");

const gatewayApi = new GatewayApi("http://localhost:3002")

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

    const ipfs_http = await import('ipfs-http-client');

    ipfs = await IPFS.create({repo: "nft-test", start: false})
    /*
    fs.writeFileSync(__dirname + "/../drop.txt", "drop", (err)=>{
        if(err) console.log(err);
    })*/

    console.log(`NFTProtocol address: ${protocolAddress}`);

    nftProtocol = await NFTProtocol.at(protocolAddress)

    await createNFTs();

    //await cidTest();

    //await fileTest()
   
    process.exit(0);
}
main();

fileTest = async() =>{

    var fileType = await file_type;

    //console.log(fileType)

    var dir = "./testfiles/"

    var glbFile = fs.readFileSync(dir + "PremierBall.glb")

    var glbMime = mime_kind(glbFile);

    console.log("glb file mime: " + JSON.stringify(glbMime))

    var gltfFile = fs.readFileSync(dir + "ethereum.gltf")

    var gltfMime = mime_kind(gltfFile)

    console.log("gltf file mime: " + JSON.stringify(gltfMime))

    var svgFile = fs.readFileSync(dir + "SVG_Example.svg")

    var svgMime = await fileType.fileTypeFromBuffer(svgFile)

    console.log("svg file mime: " + JSON.stringify(svgMime))

    //var svgFile2 =  fs.readFileSync(dir + "RatioIcon00.svg")

    var svgMime2 = mime_kind("RatioIcon00.svg")

    console.log("svg file mime2: " + JSON.stringify(svgMime2))
    /*
    var webmFile = fs.readFileSync(dir + "WebmFile.webm");

    var webmMime = mime_kind(webmFile);

    console.log("webm file mime: " + JSON.stringify(webmMime))*/

}

cidTest = async() =>{
    console.log("cid test")

    var cid1 = CID.parse("QmbUnBLPLFTbsbKAqLw998sYREst8F3Hg6UHEqbeB1m6Kn");
    console.log(cid1)

    try{
        var cid2 = CID.parse("Qmadfaefajdfauihefhisfne437fgh3ifa38bkdfnf3e43");
        console.log(cid2)
    }catch(err){
        console.log(err)
    }

    return;
}

var dir  = "./testfiles/";

var nftMap = {
    "RatioCard" : { content: {name:"Ratio Card", image: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ?filename=Ratio_Card_Base.png"} , files: [dir + "Ratio_Card_Base.png"], mintCost: 1, claimValue: 1, burnable: false},
    //"PolyCard" : {content: {name:"Poly Card", image: "ipfs://QmPSmyxBAhRa5qckBcA7W5LtSF7bAnJ8p2Rs1DLn8FU7BZ?filename=PolyCard.gif"} , files: [dir + "PolyCard.gif"], mintCost: 100, claimValue: 0, burnable: true} ,
    /*"ETHCard": {content: {name: "ETH Card", image: "ipfs://QmRrZCCTzWgFzM6FbwxDifgQkHtZePErNTxLZbJw3SLMiS?filename=ETHCard.gif", model: "ipfs://QmPv3bW8iFLJQAUUawCjJD6ciDbjzECKfFDvPEXczkbhvm?filename=ethereum.gltf"} , files: [dir + "ETHCard.gif", dir + "ethereum.gltf"]}*/
    //"PremierBall":  {content: {name: "Premier Ball", model: "ipfs://QmeFQtBPgMLL1NohoxXXE1Tpbx9GmwMsrvqFGMSfQZPnpG?filename=PremierBall.glb", audio: "ipfs://Qmf2Kv39DEdWFAQPVL5TDtqUZNtUeJ3hmjNoqk7aXcj4sa?filename=Poke_Sound.mp3"}, files: [dir + "pokesound.mp3", dir + "PremierBall.glb"], mintCost: 1, claimValue: 0.5, burnable: true},
};

createNFTs = async () =>{

    for(var n in nftMap){
        console.log(`Creating ${n} NFT...`);
        
        var nft = nftMap[n];

        var content = nftMap[n].content;

        var files = nftMap[n].files;

        try{
            var createdNFT = await createNFT(0, content, nft.mintCost.toString(), nft.claimValue.toString(), nft.burnable);

            //console.log(`   BaseURI nft: ${createdNFT.baseURI} Contract address: ${createdNFT.contract.address} NFT content: ${JSON.stringify(createdNFT.nft)}, Files: ${files}`)
        
            var block = (await createdNFT.contract.setBaseURI(createdNFT.baseURI, true, protocolAddress, {from: accounts[0], value: utils.toWei(".01", "ether")})).receipt.blockNumber;
            
            //console.log(`   Request block: ${block}`);

            await gateVerify(createdNFT, files);

            var latestBlock = await waitForBlock();

            await verifyNFT(0, createdNFT, latestBlock, block)

            /*

            var nft = createdNFT.nft;

            await createdNFT.contract.setSubURIs(nft.content.image !== undefined ? nft.content.image : "" ,
                                                nft.content.audio !== undefined ? nft.content.audio : "" ,
                                                nft.content.vidoe !== undefined ? nft.content.video : "",
                                                nft.content.model !== undefined ? nft.content.model : "", {from: accounts[0]});

            var info = await createdNFT.contract.contract.methods.info().call();*/

            //console.log(`info: ${JSON.stringify(info, null, 4)}`);

            //await viewContractState(createdNFT.contract.address)
        
        }
        catch(e){
            console.log(`Error attempting to create ${n}:` + e)
            return;
        }
    }

}

gateVerify = async (nftObj, files) =>{

    //console.log("Gate Verification Request.")

    var nft = nftObj.nft;

    var form = new FormData();

    form.append(nft.content.contract, JSON.stringify(nft))

    var content = nftObj.nft.content

    var subURIs = [content.image, content.audio, content.video, content.model]

    var f = 0;
    for(var i = 0; i < subURIs.length; i++){
        if(subURIs[i] === undefined){
            continue;
        }
        ///console.log(`   subURI: ${subURIs[i]} file: ${files[f]}`)
        form.append(subURIs[i], fs.createReadStream(files[f]));
        f++;
    }

    try{
        //console.log("Getting nft state.")

        console.log(nft.content.contract)

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

        console.log(`   nft state: ${JSON.stringify(state.data)}`)

        //return state.data.status;
    }
    catch(err){
        console.log("Gate Verification Error")
    }
}

createNFT = async(account, content, mintCost, claimValue, burnable) =>{
    var nft = {}

    var contract = await RatioSingleNFT.new(content.name, "RC", 10000, new BN(utils.toWei(mintCost, "ether")), new BN(utils.toWei(claimValue, "ether")), burnable, {from: accounts[account]});

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
        case 1:
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], block)
            break;
        case 2:
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], block)
            break;
        case 3:
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], subURIs[2], block)
            break;
        case 4:
            leaf = utils.soliditySha3(nft.contract.address, nft.nft.content.distributor, nft.baseURI, subURIs[0], subURIs[1], subURIs[2], subURIs[3], block)
            break;
    }

    // Get leaves from gateway api

    console.log(latestBlock._leaves)

    var leavesRequest = await gatewayApi.leaves(latestBlock._leaves);

    while(leavesRequest.status !== 200){
        console.log(leavesRequest.response.data)
        await new Promise(p => setTimeout(p, 2000));
        leavesRequest = await gatewayApi.leaves(latestBlock._leaves);     
    }

    console.log(leavesRequest.data);

    console.log(leaf)

    var leaves = leavesRequest.data.leaves;

    if(leaves.includes(leaf)){
        var tree = new MerkleTree(leaves, keccak256, {sort:true});
        var proof = tree.getHexProof(leaf);
        var nftStruct = {_contract: nft.contract.address, _distributor: nft.nft.content.distributor, _baseURI: nft.baseURI, _subURIs: subURIs, _block: block}
        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[account]});
        await viewContractState(nft.contract.address)
    }


    /*
    if(latestBlock._leaves.includes(leaf)){
        console.log(`Leaf included..`)

        var tree = new MerkleTree(latestBlock._leaves, keccak256, {sort:true});

        var proof = tree.getHexProof(leaf);

        var nftStruct = {_contract: nft.contract.address, _distributor: nft.nft.content.distributor, _baseURI: nft.baseURI, _subURIs: subURIs, _block: block}

        await nftProtocol.verifyNFT(proof, latestBlock._root, leaf, nftStruct, {from: accounts[account]});

        await viewContractState(nft.contract.address)
    }*/
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



const NFTProtocol = artifacts.require("NFTProtocol");

const RatioSingleNFT = artifacts.require("RatioSingleNFT");

const BadSingleNFT = artifacts.require("BadSingleNFT");

const { MerkleTree } = require('merkletreejs')

const keccak256 = require('keccak256');

const IPFS = require('ipfs');

const fs = require("fs");

const {sync: mime_kind, async} = require('mime-kind');

describe("NFTProtocol", function(){

    let accounts;

    let utils;

    let nftProtocol;

    let ipfs;

    let cardURI = "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ";

    let badCardURI = "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ";

    let badCardURI2 = "ipfs://QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJ2";

    let polyCard = "ipfs://QmZnPekNP6pjdh2rL8sDa21eBpKaJtB3G1BzijtZKF76c1";

    before(async function () {
        accounts = await web3.eth.getAccounts();
        //console.log(accounts);
        utils = await web3.utils;

        nftProtocol = await NFTProtocol.new(utils.toWei("1", "ether"), {from: accounts[4]})

        //console.log(`Protocol NFT Address: ${nftProtocol.address}`)

        ipfs = await IPFS.create({start: false})

        //console.log(web3);
    });

    it("Normal NFT verification process:", async() =>{
        // create nft contract.
        var nftContract = await createNFT(0, cardURI)

        // setBaseURI
        var setBaseURI = await nftContract.contract.setBaseURI(nftContract.baseURI, true, nftProtocol.address, {from: accounts[0], value: utils.toWei("1", "ether")});

        var requestBlock = setBaseURI.receipt.blockNumber;

        //console.log(requestBlock)

        // Oracle Processing event...
        
        //var events = await nftProtocol.getPastEvents("verificationRequest", {fromBlock: 0, toBlock: 'latest'});

        //console.log(events)

        // creates / submits merkle root;
        
        var latestBlock = await nftProtocol.latestBlock();

        console.log(`latest block: ${latestBlock._block}`);

        //console.log(`contract address: ${nftContract.address}, distributor: ${distributor}, baseURI: ${baseURI}, audio: ${nft.content.image}`)
        
        var leaf = web3.utils.soliditySha3(nftContract.contract.address, nftContract.nft.content.distributor, nftContract.baseURI, nftContract.nft.content.image, requestBlock);

        await submitBlock([leaf]);

        //console.log(`block: ${JSON.stringify(receipt.logs[0].args)}`);

        var curBlock = await nftProtocol.latestBlock();

        console.log(`curBlock: ${curBlock}`);

        // Condition simulating new block test.
        if(curBlock._block != latestBlock._block){
            console.log(`new block.`)
            console.log(curBlock._leaves)

            var userLeaf = web3.utils.soliditySha3(nftContract.contract.address, nftContract.nft.content.distributor, nftContract.baseURI, nftContract.nft.content.image, requestBlock);

            console.log(`user leaf: ${userLeaf}`)
            // Condition to determine if the leaf was added in the current block. 
            if(curBlock._leaves.includes(userLeaf)){

                // user creates proof of there nft.
                var userTree = new MerkleTree(curBlock._leaves, keccak256, {sort: true})

                var userRoot = userTree.getHexRoot();

                if(curBlock._root != userRoot){
                    console.log("MerkleTree recreation error.");
                }

                var userProof = userTree.getHexProof(userLeaf)

                console.log(`userRoot: ${userRoot} userProof: ${userProof}`)
                
                var nftStruct = {_contract: nftContract.contract.address, _distributor: nftContract.nft.content.distributor, _baseURI: nftContract.baseURI, _subURIs: [nftContract.nft.content.image], _block: requestBlock}

                // Verify NFT!.
                receipt = await nftProtocol.verifyNFT(userProof, userRoot, userLeaf, nftStruct);

                //console.log(receipt.logs[0].args)

                await viewContractState(nftContract.contract.address)
            }
            else{
                console.log("user leaf was not found.")
            }
        }
        
    })
    
    // Contract Breaking attempts...
    
    it("Malicious non hosting scenario" , async () =>{
        // Create bad hosting timeline, Wrongful distributor of subURI must be slashed. 

        // Bad NFT contract created
        var nonHostedNFT = await createNFT(1, badCardURI);

        console.log(`NON HOSTED contract address: ${nonHostedNFT.contract.address}, \nnft: ${JSON.stringify(nonHostedNFT.nft)}\nbaseURI: ${nonHostedNFT.baseURI} `)

        var nonHostBlock = (await nonHostedNFT.contract.setBaseURI(nonHostedNFT.baseURI, true, nftProtocol.address, {from: accounts[1], value: utils.toWei("1", "ether")})).receipt.blockNumber

        // nft not verifed with sub uri hidden in nonHostedNFT, STALE verification, nonHostedNFT block < hostedNFT block.

        // Bad NFT contract created with subURI of nonHostedNFT. (subURI must have been leaked or attempt at breaking verifiaction timeline.)

        var hostedNFT =  await createNFT(2, badCardURI);

        console.log(`HOSTED contract address: ${hostedNFT.contract.address}, \nnft: ${JSON.stringify(hostedNFT.nft)}\nbaseURI: ${hostedNFT.baseURI} `)

        var hostBlock = (await hostedNFT.contract.setBaseURI(hostedNFT.baseURI, true, nftProtocol.address, {from: accounts[2], value: utils.toWei("1", "ether")})).receipt.blockNumber

        // hosted NFT is verified by oracle.

        var latestBlock = await nftProtocol.latestBlock();

        //console.log(`address: ${hostedNFT.contract.address}, dist: ${hostedNFT.nft.content.distributor}, baseURI: ${hostedNFT.baseURI}, subURIs: ${hostedNFT.nft.content.image}`)

        var leaf = web3.utils.soliditySha3(hostedNFT.contract.address, hostedNFT.nft.content.distributor, hostedNFT.baseURI, hostedNFT.nft.content.image, hostBlock);

        var tree = new MerkleTree([leaf], keccak256, {sort:true});
        
        var root  = tree.getHexRoot();

        var proof = tree.getHexProof(leaf)

        var prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._block);

        var block = {_prev: prev, _root: root, _leaves: [leaf], _block: 0}

        var receipt = await nftProtocol.submitBlock(block, {from: accounts[4]});

        // hostedNFT verifes there NFT including subURI of non hosted nft.

        var nftStruct = {_contract: hostedNFT.contract.address, _distributor: hostedNFT.nft.content.distributor, _baseURI: hostedNFT.baseURI, _subURIs: [hostedNFT.nft.content.image], _block: hostBlock}

        receipt = await nftProtocol.verifyNFT(proof, root, leaf, nftStruct);

        console.log(receipt.logs[0].args);

        // View Contract State

        //await viewContractState(hostedNFT.contract.address)
        
        // nonHostedNFT hosts content.

        // Oracle verifies stale nonHostedNFT. places hosted contract in slashing list.
        
        latestBlock = await nftProtocol.latestBlock();

        leaf = web3.utils.soliditySha3(nonHostedNFT.contract.address, nonHostedNFT.nft.content.distributor, nonHostedNFT.baseURI, nonHostedNFT.nft.content.image, nonHostBlock);

        tree = new MerkleTree([leaf], keccak256, {sort:true});
        
        root  = tree.getHexRoot();

        proof = tree.getHexProof(leaf)

        prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._block);

        block = {_prev: prev, _root: root, _leaves: [leaf], _block: 0}

        receipt = await nftProtocol.submitBlock(block, {from: accounts[4]});

        // Verify stale nft pre slshing.
        /*
        var nonHostedStruct = {_contract: nonHostedNFT.contract.address, _distributor: nonHostedNFT.nft.content.distributor, _baseURI: nonHostedNFT.baseURI, _subURIs: [nonHostedNFT.nft.content.image], _block: nonHostBlock};

        receipt = await nftProtocol.verifyNFT(proof, root, leaf, nonHostedStruct)

        //console.log(receipt.logs[0].args);
        
        await viewContractState(hostedNFT.contract.address)

        await viewContractState(nonHostedNFT.contract.address);

        await nftProtocol.slashNFTs([hostedNFT.contract.address], {from: accounts[4]});

        await viewContractState(hostedNFT.contract.address)

        await viewContractState(nonHostedNFT.contract.address);
        */

        
        // Verify stale nft post slashing

        await viewContractState(hostedNFT.contract.address)
        
        // Oracle slash nfts
        await nftProtocol.slashNFTs([hostedNFT.contract.address], {from: accounts[4]});

        await viewContractState(nonHostedNFT.contract.address);

        var nonHostedStruct = {_contract: nonHostedNFT.contract.address, _distributor: nonHostedNFT.nft.content.distributor, _baseURI: nonHostedNFT.baseURI, _subURIs: [nonHostedNFT.nft.content.image], _block: nonHostBlock};

        receipt = await nftProtocol.verifyNFT(proof, root, leaf, nonHostedStruct);

        //console.log(receipt.logs[0].args);

        await viewContractState(hostedNFT.contract.address);

        await viewContractState(nonHostedNFT.contract.address);
        
    })

    
    it("Public slashing scenario", async() =>{
        // Create bad nft with changing distributor or baseURI.

        var badNFT = await createNFT(1, badCardURI2, 1);

        console.log(`bad contract: ${badNFT.contract.address}`);

        var badNFTblock = (await badNFT.contract.setBaseURI(badNFT.baseURI, true, nftProtocol.address, {from: accounts[1], value: utils.toWei("1", "ether")})).receipt.blockNumber;

        console.log(badNFTblock)

        // oracle verifies nft.

        var leaf = web3.utils.soliditySha3(badNFT.contract.address, badNFT.nft.content.distributor, badNFT.baseURI, badNFT.nft.content.image, badNFTblock);

        var tree = await submitBlock([leaf]);

        var root  = tree.getHexRoot();

        var proof = tree.getHexProof(leaf);

        var badNFTstruct = {_contract: badNFT.contract.address, _distributor: badNFT.nft.content.distributor, _baseURI: badNFT.baseURI, _subURIs: [badNFT.nft.content.image], _block: badNFTblock};

        await nftProtocol.verifyNFT(proof, root, leaf, badNFTstruct);

        var distributor = await badNFT.contract.contract.methods.distributor().call();

        console.log(`distributor: ${distributor}`);

        console.log("changing distributor...")
        // malicious distributor change.
        await badNFT.contract.setDistributor(accounts[2], {from: accounts[1]});

        distributor = await badNFT.contract.contract.methods.distributor().call();

        console.log(`distributor: ${distributor}`);

        await viewContractState(badNFT.contract.address)

        // Use Public slashing to correct contract.
        await nftProtocol.slashNFT(badNFT.contract.address)

        await viewContractState(badNFT.contract.address)
        
    })

    
    it("Invalid validation order scenario.", async() =>{

        // Create NFT spoof attack. timeline: correctNFT => malNFT1;

        var correctNFT = await createNFT(1, polyCard);

        var correctBlock = (await correctNFT.contract.setBaseURI(correctNFT.baseURI, true, nftProtocol.address, {from: accounts[1], value: utils.toWei("1", "ether")})).receipt.blockNumber

        var malNFT = await createNFT(2, polyCard);

        var malBlock = (await malNFT.contract.setBaseURI(malNFT.baseURI, true, nftProtocol.address, {from: accounts[2], value: utils.toWei("1", "ether")})).receipt.blockNumber

        // Host mal content.

        // oracle verifies mal content.

        var malLeaf = utils.soliditySha3(correctNFT.contract.address, correctNFT.nft.content.distributor, correctNFT.baseURI, correctNFT.nft.content.image, malBlock)

        var malTree = await submitBlock([malLeaf])

        // malNFT attempts to wait for validation post correct nft validation.

        // Host correct content.

        var corLeaf = utils.soliditySha3(correctNFT.contract.address, correctNFT.nft.content.distributor, correctNFT.baseURI, correctNFT.nft.content.image, correctBlock)

        var corTree = await submitBlock([corLeaf])

        var corRoot = await corTree.getHexRoot()

        var corProof = corTree.getHexProof(corLeaf)

        var corStruct = {_contract: correctNFT.contract.address, _distributor: correctNFT.nft.content.distributor, _baseURI: correctNFT.baseURI, _subURIs: [correctNFT.nft.content.image], _block: correctBlock}

        await nftProtocol.verifyNFT(corProof, corRoot, corLeaf, corStruct)

        await viewContractState(correctNFT.contract.address)

        // Attempt mal verificaiton 

        var malRoot = await malTree.getHexRoot()

        var malProof = await malTree.getHexProof(malLeaf);

        var malStruct = {_contract: malNFT.contract.address, _distributor: malNFT.nft.content.distributor, _baseURI: malNFT.baseURI, _subURIs: [malNFT.nft.content.image], _block: malBlock}

        try{
            await nftProtocol.verifyNFT(malProof, malRoot, malLeaf, malStruct);
        }
        catch(err)
        {
            console.log(`nice try... good... good...`)
        }

        await viewContractState(malNFT.contract.address)

    })
    
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

    submitBlock = async(leaves) =>{

        var latestBlock = await nftProtocol.latestBlock();

        var tree = new MerkleTree(leaves, keccak256, {sort:true});
        
        var root  = tree.getHexRoot();

        var prev = web3.utils.soliditySha3(latestBlock._prev, latestBlock._root, latestBlock._block);

        var block = {_prev: prev, _root: root, _leaves: leaves, _block: 0}

        await nftProtocol.submitBlock(block, {from: accounts[4]});

        return tree;
    }

    /*
    it("Old Testing", async function(){

        var nftContract = await RatioSingleNFT.new("RatioNFT", "RC", 1000000000, utils.toWei("1", "ether"));

        var distributor = await nftContract.contract.methods.distributor().call();

        console.log(distributor);
        
        //console.log(nftProtocol.address);
        
        var block = await web3.eth.getBlockNumber();

        console.log(block)

        var setBaseURI = await nftContract.setBaseURI("ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", true, nftProtocol.address, {from: accounts[0], value: utils.toWei("1", "ether")});
        
        //var events = await nftProtocol.getPastEvents("verificationRequest", {fromBlock: 0, toBlock: 'latest'});

        var nft = {_contract: nftContract.address, _distributor: distributor, _baseURI: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", _subURIs: ["ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrb", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"]}

        //var receipt = await nftProtocol.structPassTest(leaf)

        //console.log(receipt.logs[0].args)

        //var leaves = [{_contract: nftContract.address, _distributor: distributor, _baseURI: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", _subURIs:["ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ","ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"]}]

        //var leafHash = utils.soliditySha3({t: 'address', v: nftContract.address}, {t: 'address', v: distributor}, {t: 'string', v: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"})
        
        var leaf1 = utils.soliditySha3(nftContract.address, distributor, "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrb", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ")

        var leaf2 = utils.soliditySha3(nftContract.address, distributor, "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mra")

        console.log(`leafHash: ${leaf1.toString('hex')}`)

        //receipt = await nftProtocol.structHashTest(leafHash, leaf)

        //console.log(receipt.logs[0].args)

        var tree = new MerkleTree([leaf2, leaf1], keccak256, {sort:true});

        var root  = tree.getHexRoot();

        var proof = tree.getHexProof(leaf1)

        //var verified = await nftProtocol.verifyProofTest(root, leafHash, proof, leaf);

        //console.log(verified.logs[0].args);

        receipt = await nftProtocol.submitRoot(root, {from: accounts[4]});

        console.log(`root: ${receipt.logs[0].args._root} block: ${receipt.logs[0].args._block.toString()}`);

        receipt = await nftProtocol.verifyNFT(proof, root, leaf1, nft);

        console.log(receipt.logs[0].args)
    })

    */

})
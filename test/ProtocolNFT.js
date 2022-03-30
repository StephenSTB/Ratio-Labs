const ProtocolNFT = artifacts.require("ProtocolNFT");

const RatioNFT = artifacts.require("RatioNFT");

const fs = require("fs");

const { MerkleTree } = require('merkletreejs')

const keccak256 = require('keccak256')


describe("RatioNFT testing", function(){

    let accounts;

    let utils;

    var protocolNFT;

    before(async function () {
        accounts = await web3.eth.getAccounts();
        utils = await web3.utils;

        //console.log(web3);
    });

    it("Deploy Protocol NFT Contract", async function(){

        protocolNFT = await ProtocolNFT.new(utils.toWei("1", "ether"), {from: accounts[4]})

        nftContract = await RatioNFT.new("RatioNFT", "RC", 1000000000, utils.toWei("1", "ether"));

        var distributor = await nftContract.owner();

        //console.log(protocolNFT.address);

        var block = await web3.eth.getBlockNumber();

        console.log(block)

        var setBaseURI = await nftContract.setBaseURI("ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", true, protocolNFT.address, {from: accounts[0], value: utils.toWei("1", "ether")});
        
        //var events = await protocolNFT.getPastEvents("verificationRequest", {fromBlock: 0, toBlock: 'latest'});

        var nft = {_contract: nftContract.address, _distributor: distributor, _baseURI: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", _subURIs: ["ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrb", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"]}

        //var receipt = await protocolNFT.structPassTest(leaf)

        //console.log(receipt.logs[0].args)

        //var leaves = [{_contract: nftContract.address, _distributor: distributor, _baseURI: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", _subURIs:["ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ","ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"]}]

        //var leafHash = utils.soliditySha3({t: 'address', v: nftContract.address}, {t: 'address', v: distributor}, {t: 'string', v: "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ"})
        
        var leaf1 = utils.soliditySha3(nftContract.address, distributor, "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrb", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ")

        var leaf2 = utils.soliditySha3(nftContract.address, distributor, "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ", "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mra")

        console.log(`leafHash: ${leaf1.toString('hex')}`)

        //receipt = await protocolNFT.structHashTest(leafHash, leaf)

        //console.log(receipt.logs[0].args)

        var tree = new MerkleTree([leaf2, leaf1], keccak256, {sort:true});

        var root  = tree.getHexRoot();

        var proof = tree.getHexProof(leaf1)

        //var verified = await protocolNFT.verifyProofTest(root, leafHash, proof, leaf);

        //console.log(verified.logs[0].args);

        receipt = await protocolNFT.submitRoot(root, {from: accounts[4]});

        console.log(`root: ${receipt.logs[0].args._root} block: ${receipt.logs[0].args._block.toString()}`);

        receipt = await protocolNFT.verifyNFT(proof, root, leaf1, nft);

        console.log(receipt.logs[0].args)
    })

})
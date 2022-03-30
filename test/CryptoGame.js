const CryptoGame = artifacts.require("CryptoGame");

const NFTMinter = artifacts.require("NFTMinter");

const NFTChef = artifacts.require("NFTChef");

const BNBCard = artifacts.require("BNBCard");

const WBNB = artifacts.require("WBNB");

const WMatic = artifacts.require("WMatic");

const PolyCard = artifacts.require("PolyCard");

const fs = require("fs");

describe("BNBCard Mint Testing", function(){

    let accounts;

    let utils;

    var cryptoGame;

    var nftMinter;

    var nftChef;

    var wbnb;
    
    var wmatic

    var bnbCard;

    var tenCommon;

    const NFT_CID =  JSON.parse(fs.readFileSync("./IPFS/NFT_CID.json"));

    before(async function () {
        accounts = await web3.eth.getAccounts();
        utils = await web3.utils;

        //console.log(web3);
    });

    it("Initialization test", async function(){
        //console.log(NFT_CID["PolyCard_Ten_Common.gif"]);

        //assert.equal(NFT_CID["PolyCard_Ten_Common.gif"], "Qmci4x92WCPfTM6ux53gDBzWU2nqcDg8Q9zt5E5SbvfW6G")

        console.log("account " + accounts[0]);
    })

    it("Deploying Contracts", async function (){

        cryptoGame = await CryptoGame.new({from: accounts[0]});

        var block = await web3.eth.getBlockNumber();
        
        nftChef = await NFTChef.new(cryptoGame.address, accounts[1], utils.toWei('10', "ether"), block, (block + 201600), {from: accounts[0]})
        
        await cryptoGame.transferOwnership(nftChef.address, {from: accounts[0]});
        
        nftMinter = await NFTMinter.new(nftChef.address);

        await nftChef.transferOwnership(nftMinter.address, {from: accounts[0]});
        
        wmatic = await WMatic.new(utils.toWei("10000", "ether"), {from: accounts[0]});
        
        tenCommon = await PolyCard.new(wmatic.address, NFT_CID["PolyCard_Ten_Common.gif"], "PoylCard_Ten_Common", "PCTC", {from: accounts[0]});

        await tenCommon.transferOwnership(nftMinter.address, {from: accounts[0]});

        assert.equal(await wmatic.balanceOf(accounts[0]), utils.toWei('10000', "ether"));

        //console.log("URI: " + await tenCommon.contract.methods.URI.call().call({from: accounts[0]}))*/
        

        assert.equal(await tenCommon.contract.methods.URI.call().call({from: accounts[0]}), NFT_CID["PolyCard_Ten_Common.gif"])

        assert.equal(await cryptoGame.owner(), nftChef.address)

        assert.equal(await nftChef.owner(), nftMinter.address)

        assert.equal(await tenCommon.owner(), nftMinter.address)
        
    })
    
    it("Add PolyCard_Ten_Common to NFTMinter", async function(){
        await nftMinter.add(tenCommon.address, wmatic.address, utils.toWei("10", "ether") , 201600, 100);

        await wmatic.approve(nftChef.address, utils.toWei("10", "ether"), {from: accounts[0]})

        var id;

        await nftMinter.mint(tenCommon.address ,{from: accounts[0]} ).then(function(result){
            //console.log(result)
            console.log(`NFT_Mint address: ${result.logs[0].args._nft} id: ${result.logs[0].args._id.toNumber()}`);
            id = result.logs[0].args._id;
        });

        console.log(await tenCommon.tokenURI(id));
    })

    /*
    it("Deploying NFT contracts", async function(){

        console.log(`Dev account: ${accounts[0]}`);

        wbnb = await WBNB.new(utils.toWei("100", "ether"), {from: accounts[0]});

        var balance = await wbnb.balanceOf(accounts[0]);

        console.log(utils.fromWei(balance, "ether"));

        assert.equal(await wbnb.balanceOf(accounts[0]), utils.toWei('100', "ether"));

        console.log(`wbnb Address: ${wbnb.address}`);

        bnbCard = await BNBCard.new(wbnb.address, {from: accounts[0]});

        var owner = await bnbCard.owner()

        console.log(`bnbCard owner: ${owner}`)
        
        var block = await web3.eth.getBlockNumber();

        console.log(`current block number: ${block}: block and week: ${(block + 201600)}`)

        cryptoGame = await CryptoGame.new({from: accounts[0]});

        nftChef = await NFTChef.new(cryptoGame.address, accounts[1], utils.toWei('10', "ether"), block, (block + 201600), {from: accounts[0]})

        console.log(`nftChef address: ${nftChef.address}`)

        await cryptoGame.transferOwnership(nftChef.address, {from: accounts[0]});

        owner = await cryptoGame.owner();

        console.log(`crypto game owner: ${owner}`);

        nftMinter = await NFTMinter.new(nftChef.address);

        owner = await nftMinter.owner();

        console.log(`nftMinter address: ${nftMinter.address} owner: ${owner}`);

        await bnbCard.transferOwnership(nftMinter.address, {from: accounts[0]});

        owner = await bnbCard.owner();

        console.log(`bnbCard owner: ${owner}`)

        await nftChef.transferOwnership(nftMinter.address, {from: accounts[0]});

        owner = await nftChef.owner();

        console.log(`nftChef owner: ${owner}`);
    })

    it("Adding BNBCard to NFTMinter and Minting a bnbCard",async function(){
        // duration 7 day stake with 20 blocks per minute = 201600 blocks
        await nftMinter.add(bnbCard.address, wbnb.address, utils.toWei(".1", "ether") , 201600, 100);

        //var len = await nftChef.poolLength();

        //console.log(len.toString())
        
        var nftInfo = await nftMinter.contract.methods.nfts(bnbCard.address).call();

        console.log(`token : ${nftInfo.token}, Stake: ${nftInfo.stake}, duration: ${nftInfo.duration}, pid ${nftInfo.pid}`)

        //var balance = await wbnb.balanceOf(accounts[0]);

        //console.log(utils.fromWei(balance, "ether"));

        //console.log(nftInfo);

        await wbnb.approve(nftChef.address, utils.toWei(".1", "ether"), {from: accounts[0]})

        var allowance =  await wbnb.allowance(accounts[0], nftChef.address);

        console.log(utils.fromWei(allowance, "ether"));

        var balance = await wbnb.balanceOf(accounts[0]);

        console.log(`account balance: ${utils.fromWei(balance, "ether")}`)

        var block = await web3.eth.getBlockNumber();

        console.log(`block number: ${block}`);

        var id;

        await nftMinter.mint(bnbCard.address, {from: accounts[0]}).then(function(result){
            //console.log(result)
            console.log(`NFT_Mint address: ${result.logs[0].args._nft} id: ${result.logs[0].args._id.toNumber()}`);
            id = result.logs[0].args._id;
        });

        //console.log(res.logs[0].args)

        balance = await wbnb.balanceOf(accounts[0]);

        var poolInfo = await nftChef.contract.methods.poolInfo(0).call();

        console.log(`account balance: ${utils.fromWei(balance, "ether")}`);

        console.log(poolInfo);

        block = await web3.eth.getBlockNumber();

        console.log(`block number: ${block}`);

        await nftChef.massUpdatePools();

        block = await web3.eth.getBlockNumber();

        console.log(`block number: ${block}`);

        var pendingCG = await nftChef.pendingCryptoGame(0, id);

        console.log(`nft id : ${id} pending tokens: ${utils.fromWei(pendingCG, "ether")}`)
        
    })*/

})
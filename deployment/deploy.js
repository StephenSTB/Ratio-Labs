// Web3
const contract = require("@truffle/contract");

const HDWalletProvider = require("@truffle/hdwallet-provider")

const ganache = require("ganache");

const Web3 = require("web3");

const utils = Web3.utils;

const BN = utils.BN;

const providers = require("../src/data/Providers.json");

// Files
const NFT_CID = require("../src/data/NFT_CID.json");

var deployedContracts = require("../src/data/Deployed_Contracts.json");

const fs = require("fs");

const mnemonic = fs.readFileSync(".secret").toString().trim();

// Contracts
const NFTProtocol = contract(require('../src/contracts/NFTProtocol.json'));

const CryptoGame = contract(require('../src/contracts/CryptoGame.json'));

const NFTChef = contract(require('../src/contracts/NFTChef.json'));

const NFTMinter = contract(require('../src/contracts/NFTMinter.json'));

const WMatic = contract(require("../src/contracts/WMatic.json"));

const PolyCard = contract(require('../src/contracts/PolyCard.json'));

const RatioNFT = contract(require('../src/contracts/RatioSingleNFT.json'));

const CryptoMonkeys = contract(require(`../src/contracts/CryptoMonkeys.json`));

var nftProtocol;

var nftChef;

var nftMinter;

var cryptoGame;

// State Variables
var provider;

var web3;

var accounts;

var contractDeploy = [];

var delay = false;

// Main Deployment Entry Point.
deploy = async() =>{
    console.log("Deploying Contracts...");

    var args = process.argv.splice(2);

    console.log(args[0])

    console.log(JSON.stringify(providers, null, 4))

    switch(args[0]){
        case 'developmentCLI':
            provider = ganache.provider({mnemonic: mnemonic, quiet: true}) //
            break;
        case 'Ganache':
            provider = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers[args[0]].url})
            break;
        case 'Mumbai':
            //provider = new Web3.providers.WebsocketProvider(providers[args[0]].url);
            provider = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: providers[args[0]].url})
            break;
        default:
            console.log("Invalid deployment network given,");
    }

    if(provider === null){
        return
    }
    
    //console.log(provider)

    web3 = new Web3(provider);
    
    var connected = await web3.eth.net.isListening();

    if(!connected){
        console.log("could not connect to provider")
        return
    }

    console.log(`Connected : ${connected}`)

    accounts = await web3.eth.getAccounts();

    var balance = await web3.eth.getBalance(accounts[4])

    console.log(`${accounts[4]}: ${balance}`);

    for(var i = 1; i < args.length; i++){
        switch(args[i]){
            case "all":
                contractDeploy.push("all")
                break;
            case "PolyCards":
                contractDeploy.push("PolyCards");
                break;
            case "NFTProtocol":
                contractDeploy.push("NFTProtocol");
                break;
            case "NFTMinter":
                contractDeploy.push("NFTMinter");
                break;
            case "CryptoMonkeys":
                contractDeploy.push("CryptoMonkeys");
                break;
            case "Delay":
                delay = true;
            default:
                break
        }
    }

    if(deployedContracts[args[0]] === undefined){
        deployedContracts[args[0]] = {};
    }

    // Ratio NFT Protocol
    if(contractDeploy.includes("all") || contractDeploy.includes("NFTProtocol")){

        console.log("Attempting to create NFTProtocol contract:")

        NFTProtocol.setProvider(provider);

        nftProtocol = await NFTProtocol.new(utils.toWei(".01", "ether"), {from: accounts[4]});

        console.log(nftProtocol.transactionHash)

        var transaction = await web3.eth.getTransaction(nftProtocol.transactionHash)

        var gas = utils.fromWei((Number(transaction.gas) * Number(transaction.gasPrice)).toString(), "ether");

        console.log(`   gas cost: ${gas}`);

        deployedContracts[args[0]]["NFTProtocol"] = {address: nftProtocol.address}

        console.log(` NFTProtocol deployed to '${nftProtocol.address}' on ${args[0]}`)
    }

    
    // NFT Minter
    if(contractDeploy.includes("all") || contractDeploy.includes("NFTMinter")){

        console.log("Attempting to create CryptoGame contracts:")

        CryptoGame.setProvider(provider);

        NFTChef.setProvider(provider)

        NFTMinter.setProvider(provider)

        cryptoGame = await CryptoGame.new({from: accounts[4]});

        console.log(` CryptoGame token deployed to '${cryptoGame.address}' on ${args[0]}`)

        var block = await web3.eth.getBlockNumber();

        nftChef = await NFTChef.new(cryptoGame.address, accounts[4], utils.toWei('10', "ether"), block, (block + 201600), {from: accounts[4]})

        console.log(` NFTChef deployed to '${nftChef.address}' on ${args[0]}`)
        
        await cryptoGame.transferOwnership(nftChef.address, {from: accounts[4]});
        
        nftMinter = await NFTMinter.new(nftChef.address, {from: accounts[4]});

        console.log(` NFTMinter deployed to '${nftChef.address}' on ${args[0]}`)

        await nftChef.transferOwnership(nftMinter.address, {from: accounts[4]});

        deployedContracts[args[0]]["CryptoGame"] = {address: cryptoGame.address};

        deployedContracts[args[0]]["NFTChef"] = {address: nftChef.address};

        deployedContracts[args[0]]["NFTMinter"] = {address: nftMinter.address};

    }

    // CryptoMonkeys
    if(contractDeploy.includes("all") || contractDeploy.includes("CryptoMonkeys")){

        CryptoMonkeys.setProvider(provider);

        cryptoMonkeys = await CryptoMonkeys.new(cryptoGame.address, nftProtocol.address, utils.toWei("1", "ether"), {from: accounts[4]})

        console.log(` CryptoMonkeys deployed to '${cryptoMonkeys.address}' on ${args[0]}`)

        deployedContracts[args[0]]["CryptoMonkeys"] = {address: cryptoMonkeys.address};

    }

    // PolyCards
    if(contractDeploy.includes("all") || contractDeploy.includes("PolyCards")){

        WMatic.setProvider(provider);

        var wMatic = await WMatic.new(utils.toWei("1000000","ether"), {from: accounts[4]});

        console.log("wMatic Address: " + wMatic.address)

        //console.log(wMatic.transactionHash);

        var receipt = await web3.eth.getTransaction(wMatic.transactionHash)

        var price = (Number(receipt.gas) * Number(receipt.gasPrice)).toString()

        console.log("    cost: " + utils.fromWei(new BN (price), "ether"))

        //var balance = await wMatic.balanceOf(accounts[0])

        //console.log("balance: " + utils.fromWei(balance, "ether"))
        
        PolyCard.setProvider(provider);

        deployedContracts[args[0]] = {}

        for(var n in NFT_CID){
            var nft = n.slice(0, n.length -4).replace(/_/g, ' ')
            //console.log(nft + ":");

            var uri = "ipfs://" + NFT_CID[n];
            //console.log(uri)

            var sym = nft.replace(/[a-z]/g, "")

            sym = sym.replace(" ", "")

            console.log(sym);

            var polyCard = await PolyCard.new(nft, sym, {from: accounts[4]});

            receipt = await web3.eth.getTransaction(polyCard.transactionHash)

            //console.log("raw cost:" + receipt.gas + " " + receipt.gasPrice);

            var price = Number(receipt.gas) * Number(receipt.gasPrice)

            console.log(price.toString())

            console.log(nft + " cost: " + utils.fromWei(new BN(price.toString()), "ether"));

            deployedContracts[args[0]]["PolyCards"][nft] = {address: polyCard.address, baseURI: uri};
        }
    }

    //console.log(deployedContracts);

    fs.writeFileSync("./deployment/Deployed_Contracts.json", JSON.stringify(deployedContracts, null, 4), (err) =>{
        if(err){
            console.log(err)
        }
    })
    
    fs.writeFileSync("./src/data/Deployed_Contracts.json", JSON.stringify(deployedContracts, null, 4), (err) =>{
        if(err){
            console.log(err)
        }
    })

    if(delay){
        console.log(`Waiting for Oracle reboot...`)

        await new Promise(p => setTimeout(p, 10000));

        console.log(`Waiting Complete`)
    }
    

    process.exit(0);
}

deploy();
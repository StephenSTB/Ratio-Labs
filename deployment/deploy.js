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
const WMatic = contract(require("../src/contracts/WMatic.json"));

const PolyCard = contract(require('../src/contracts/PolyCard.json'));

const RatioNFT = contract(require('../src/contracts/RatioNFT.json'));

const NFTProtocol = contract(require('../src/contracts/NFTProtocol.json'));

// State Variables
var provider;

var web3;

var accounts;

var contractDeploy = [];

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
            provider = new Web3.providers.WebsocketProvider(providers[args[0]].url);
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

    accounts = await web3.eth.getAccounts();

    for(var i = 1; i < args.length; i++){
        switch(args[i]){
            case "all":
                contractDeploy.push("all")
                break;
            case "polyCards":
                contractDeploy.push("polyCards");
                break;
            case "ratioNFT":
                contractDeploy.push("ratioNFT");
                break;
            default:
                break
        }
    }

    if(deployedContracts[args[0]] === undefined){
        deployedContracts[args[0]] = {};
    }

    // Ratio NFT Protocol
    if(contractDeploy.includes("all") || contractDeploy.includes("ratioNFT")){

        NFTProtocol.setProvider(provider);

        var nftProtocol = await NFTProtocol.new(utils.toWei(".01", "ether"), {from: accounts[4]});

        deployedContracts[args[0]]["NFTProtocol"] = {address: nftProtocol.address}

        console.log(` NFTProtocol deployed to '${nftProtocol.address}' on ${args[0]}`)
    }

    // PolyCards
    if(contractDeploy.includes("all") || contractDeploy.includes("polyCards")){

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

            var polyCard = await PolyCard.new(wMatic.address, uri, nft, sym, {from: accounts[4]});

            receipt = await web3.eth.getTransaction(polyCard.transactionHash)

            //console.log("raw cost:" + receipt.gas + " " + receipt.gasPrice);

            var price = Number(receipt.gas) * Number(receipt.gasPrice)

            console.log(price.toString())

            console.log(nft + " cost: " + utils.fromWei(new BN(price.toString()), "ether"));

            deployedContracts[args[0]][nft] = {address: polyCard.address, uri: uri};
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

    console.log(`Waiting for Oracle reboot...`)

    await new Promise(p => setTimeout(p, 45000));

    console.log(`Waiting Complete`)

    process.exit(0);
}

deploy();
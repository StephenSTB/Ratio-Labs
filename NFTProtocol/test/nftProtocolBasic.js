const Web3 = require('web3');

const HDWalletProvider = require("@truffle/hdwallet-provider")

const IPFS = require("ipfs");

const fs = require("fs");

const mnemonic = fs.readFileSync("../.secret").toString().trim();

var content = require("./NFTContent.json");

var provider = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: "http://192.168.1.136:7545"})

var web3 = new Web3(provider)



create = async() =>{
    
    var accounts =  await web3.eth.getAccounts();

    console.log(accounts[0])

    content["contract"] = "0x021218aeaf56394066a76607C0c31B0Ed625c10D";
    content["distributor"] = accounts[0]

    console.log(content)
    /*

    var privateKeyBuffer = await web3.eth.accounts._provider.wallets[accounts[0].toLowerCase()].privateKey;

    var privateKey = "0x" + privateKeyBuffer.toString('hex');

    console.log(privateKey)

    var signedContent = web3.eth.accounts.sign(JSON.stringify(content), privateKey)

    console.log(signedContent);

    var verifySigner = web3.eth.accounts.recover(JSON.stringify(content), signedContent.signature)

    console.log(verifySigner)*/

    var hash =  web3.utils.sha3(JSON.stringify(content))

    console.log(hash)

    signedContent = await web3.eth.personal.sign(hash, accounts[0])

    console.log(signedContent)

    verifySigner = web3.eth.accounts.recover(hash, signedContent)

    console.log(verifySigner)

    var nft = {
            content : content,
            signature: signedContent
        }
    
    console.log(JSON.stringify(nft, null, 4));

    var ipfs = await IPFS.create({start: false, offline: true})

    //console.log(await ipfs.swarm.peers())


    var cryptoMonkey = await ipfs.add("./CryptoMonkeyRatioNFT.json")

    console.log(cryptoMonkey.cid.toString())


    process.exit(1);
}
create();
const Web3 = require('web3')

const fs = require("fs");

const bip39 = require('bip39')

var HDKey = require('hdkey');

var crypto = require("crypto");

var eccrypto = require("eccrypto");

const secp256k1 = require('secp256k1');

const {utils, ecvrf, sortition} = require('vrf.js')

const { Evaluate, ProofToHash } = require('@idena/vrf-js');

const providers = require('../src/data/Providers.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');

var mnemonic = fs.readFileSync(".secret")

var privateKey;

var publicKey;

// Variable to hold command arguments.
var args;

var providerName: string;

var provider: Object;

// Web3
let web3 : any;

interface IMonkeyParams{
    id: number;
    block: number;
    prev: string;
}

const web3init = async () =>{
    args = process.argv.splice(2);
    console.log(`Provider name: ${args[0]}`);
    providerName = args[0];
    try{
        switch(args[0]){
            case 'Ganache':
                provider = new Web3.providers.WebsocketProvider(providers[args[0]].url)
                break;
            case 'Mumbai':
                provider = new Web3.providers.WebsocketProvider(providers[args[0]].url);
                break;
            default:
                console.log("Invalid deployment network given,");
        }
    }catch(err){
        console.log(err);
    }

    try{
        if(provider === null){
            console.log("Invalid provider given.");
            process.exit(1);
        }
    }catch(err){
        console.log(err);
    }
    web3 = new Web3(provider);
    var wallet = new HDWalletProvider({mnemonic: mnemonic.toString(), providerOrUrl: providers[args[0]].url})
    
    for(var w in wallet.wallets){
        //console.log(wallet.wallets[w].privateKey)
        //accounts.push(wallet.wallets[w].publicKey.toString())
        
        web3.eth.accounts.wallet.add("0x"+ wallet.wallets[w].privateKey.toString('hex'))
    }

    //console.log(web3.eth.accounts.wallet)

    //console.log(accounts[4]);
    
}

const init = async () => {

    console.log(mnemonic.toString())

    var seed = bip39.mnemonicToSeedSync(mnemonic.toString());

    var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"))

    var child = hdkey.derive(("m'/44'/60'/0'/0/" + "0"))

    privateKey = child._privateKey// "0x" + child._privateKey.toString('hex');

    var privateKeyEth = "0x" + child._privateKey.toString('hex');

    var publicKey = eccrypto.getPublic(privateKey)

    console.log(privateKey.length)

    console.log(publicKey.length)

    var x = new Uint8Array(publicKey.slice(1,33))

    var y = new Uint8Array(publicKey.slice(33,65))

    console.log(x.length);
    console.log(y.length)

    console.log(x)
    console.log(y)

    console.log(publicKey.toString('hex'))

    console.log(Buffer.from(x).toString('hex'))

    console.log(Buffer.from(y).toString('hex'))

    //await web3init();

    //var account = web3.eth.accounts.privateKeyToAccount(privateKeyEth);

    //console.log(account);
    

    var data = new Uint8Array(privateKey.length + 1);

    data.set(new Uint8Array([0]))

    data.set(privateKey, 1)

    console.log(data)
    
    //data.push()

    //var [hash, proof] = Evaluate(privateKey, data)

    //console.log(hash.length);

    //console.log(proof.length)

    console.log(Buffer.from('031f4dbca087a1972d04a07a779b7df1caa99e0f5db2aa21f3aecc4f9e10e85d0814faa89697b482daa377fb6b4a8b0191a65d34a6d90a8a2461e5db9205d4cf0bb4b2c31b5ef6997a585a9f1a72517b6f', 'hex').length)

    //console.log(Buffer.from(proof).toString('hex'));

    //const hash_verifiy = ProofToHash(publicKey, data, proof);

    //console.log(hash);

    //console.log(hash_verifiy)

    publicKey = {x, y}

    const X = Buffer.from('test')
    const [pubKey, privKey] = utils.generatePair()

    console.log(pubKey.length)
    console.log(privKey.length)

    const proof = ecvrf.prove(pubKey, privKey, X)

    console.log(proof.length);

    const value = ecvrf.proofToHash(proof)

    console.log(value)

}

init();




const monkey = async(parms:IMonkeyParams) =>{

    const {id, block, prev} = parms;

}

export {init, monkey}
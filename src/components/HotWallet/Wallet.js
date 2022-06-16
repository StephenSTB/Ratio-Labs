import Web3 from 'web3';

import * as bip39 from 'bip39';

import providers from "../../data/Providers.json"

import networkData from "../../data/Network_Data.json"

const CryptoJS = require("crypto-js");

var HDKey = require('hdkey');

export default class Wallet{

    constructor(){
        this.utils = Web3.utils;
        this.unlocked = false;

        this.networkData = [];

        for(var n in networkData){
            this.networkData.push({name: networkData[n].chainName, id: n, asset: providers[networkData[n].chainName].asset});
        }
    }

    retrieve(){
        return localStorage.getItem("hotWallet");
    }

    createMnemonic(){
        return bip39.generateMnemonic();
    }

    setWallet(mnemonic, password){
        var status = {success: false, error: ""}
        if(!bip39.validateMnemonic(mnemonic)){
            status.error = "Invalid mnemonic given."
            return status;
        }
        if(password.length < 12){
            status.error = "Invalid password length given."
            return status;
        }
        var encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();

        var hmac =  CryptoJS.HmacSHA256(encryptedMnemonic, CryptoJS.SHA256(password)).toString();

        localStorage.setItem("hotWallet", JSON.stringify({encryptedMnemonic, hmac}));

        status.success = true;
        return status;
    }

    unlockWallet (password, network){
        var status = {success: false, error: ""}

        var cookie = JSON.parse(this.retrieve());

        var vhmac = CryptoJS.HmacSHA256(cookie["encryptedMnemonic"], CryptoJS.SHA256(password)).toString();

        if(cookie["hmac"] !== vhmac){
            status.error = "Incorrect Password or Wallet. Try password again or import wallet."
            return status;
        }

        var decryptedMnemonic = CryptoJS.AES.decrypt(cookie["encryptedMnemonic"], password).toString(CryptoJS.enc.Utf8)

        console.log(decryptedMnemonic)

        if(networkData[network] === undefined){
            status.error = "Invalid network given to wallet."
            return status;
        }

        this.network = network;

        this.provider = providers[networkData[network].chainName].url;

        this.web3  = new Web3(this.provider);

        var seed = bip39.mnemonicToSeedSync(decryptedMnemonic);

        console.log(seed)

        var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"))

        var accounts = [];

        for(var i = 0; i < 10; i++){
            var child = hdkey.derive(("m'/44'/60'/0'/0/" + i))

            console.log(child._privateKey.toString('hex'))

            var privateKey  = "0x" + child._privateKey.toString('hex');

            var account = this.web3.eth.accounts.wallet.add(privateKey);

            accounts.push(account.address);

            //this.web3.eth.personal.importRawKey(child._privateKey.toString('hex'));
        }

        this.accounts = accounts;

        this.account = this.accounts[0];

        this.unlocked = true;

        status.success = true;
        return status;
    }

    lockWallet (){
        delete this.web3;
        delete this.provider;
        delete this.accounts;
        delete this.account;
        delete this.networkData;
        delete this.networkID

        this.unlocked = false;
    }

    changeAccount(account){
        if(!this.accounts.includes(account)){
            return
        }
        this.account = account;
    }

    getNetworkData(){
        return this.networkData;
    }

    changeProvider(network){
        var status = {success: false, error: ""}
        if(networkData[network] === undefined){
            status.error = "Invalid network argument."
            return status;
        }
        if(this.web3 === undefined){
            status.error = "Wallet has not been unlocked";
            return status;
        }

        this.network = network;

        console.log(this.web3.eth.accounts.wallet)

        this.web3.setProvider(providers[networkData[network].chainName].url);

        status.success = true;
        return status;
    }

    /*async functions*/

    getBalance = async() =>{
        return await this.web3.eth.getBalance(this.account)
    }

    send = async (recipient, amount) =>{
        
        var tx = {
            from: this.account,
            to: recipient,
            value: this.utils.toWei(amount.toString(), "ether"),
            gas: 21000
        }

        console.log(tx);

        return await this.web3.eth.sendTransaction(tx)
    }
}
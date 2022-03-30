import React, { Component, useState } from "react";

import {Button, Icon, Segment, Input, Popup, Card, Form, Image, Header, Dropdown, Divider, Label, Loader} from 'semantic-ui-react';

import HDWalletProvider from "@truffle/hdwallet-provider";

import "./HotWallet.css";

import Web3 from 'web3';

import * as bip39 from 'bip39';

import fire from "../../logos/wallet/Fire.png";

import polygonImage from "../../logos/wallet/chains/polygonSymbol.jpg";

import mumbaiImage from "../../logos/wallet/chains/polygonMumbai.png"

import ganacheImage from "../../logos/wallet/chains/ganache.png";

import kovanImage from "../../logos/wallet/chains/kovan.png";

import QRCode from 'qrcode';

import providers from "../../data/Providers.json"

import networkData from "../../data/Network_Data.json"

var web3;

var provider;

var utils = Web3.utils;

const CryptoJS = require("crypto-js");

var networkSymbols = {
    "Polygon" : polygonImage,
    "Mumbai" : mumbaiImage,
    "Ganache" : ganacheImage,
    "Kovan": kovanImage
}

class HotWallet extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {CreateImport: false, Create: false , Import: false, Unlock: false, Display: false, Send: false, 
                      passwordOne: "", passwordTwo: "", mnemonic: "",
                      error: "",
                      accounts: null, account: null, accountPlaceholder: null, balance: null,
                      providers: null, providerPlaceholder: null,
                      asset: null, assetImage: null,

                     }
        this.createWallet = this.createWallet.bind(this);
        this.setPasswordOne = this.setPasswordOne.bind(this)
        this.setPasswordTwo = this.setPasswordTwo.bind(this)
        this.importWallet = this.importWallet.bind(this);
        this.setMnemomnic = this.setMnemomnic.bind(this)
        this.setWallet = this.setWallet.bind(this);
        this.unlockWallet = this.unlockWallet.bind(this);
        this.backUnlock = this.backUnlock.bind(this)
        this.changeAccount = this.changeAccount.bind(this)
        this.changeProvider = this.changeProvider.bind(this)
        this.sendPrompt = this.sendPrompt.bind(this);
        this.test = true;
    }

    componentDidMount = async() => {

        //console.log(this.props.loadWallet)

        console.log(this.props);

        if(this.test){
            await this.unlockWallet("password1234")
            return
        }
        
        var wallet = localStorage.getItem("hotWallet");
        //console.log("wallet: " + wallet);



        if(wallet === null){
            //console.log("wallet was null create new wallet?")

            this.setState({CreateImport: true})
            return;
        }
        else{
            //localStorage.removeItem("hotWallet")
            this.setState({Unlock: true})
            //this.setState({Display:true})
            return;
        }
    }

    componentDidUpdate = (prevProps) =>{
        if(prevProps.network.toString() !== this.props.network.toString()){
            console.log(prevProps.network)
            console.log(this.props.network)

            var url = providers[networkData[this.props.network.toString()].chainName].url

            console.log(url)

            this.changeProvider(null, {value: url })
        }

    }

    createWallet = () =>{
        //console.log("create Wallet");
        var mnemonic = bip39.generateMnemonic();

        this.setState(()=>({CreateImport: false, Create: true, mnemonic}))
    }
    
    importWallet = () =>{
        this.setState(()=>({CreateImport: false, Display: false, Create: false, Import: true}))
    }

    setMnemomnic = async (event) =>{
        //console.log(event.target.value)
        this.setState(() =>({mnemonic: event.target.value}))
    }

    setPasswordOne = async (event) =>{
        this.setState({passwordOne: event.target.value})
    }
   

    setPasswordTwo= async (event) =>{
        this.setState({passwordTwo: event.target.value})
    }

    setWallet = () =>{
        var passwordOne = this.state.passwordOne;
        var passwordTwo = this.state.passwordTwo;
        var mnemonic = this.state.mnemonic;

        var error = "";

        if(passwordOne.toString().length < 12 || passwordTwo.toString().length < 12){
            error = "Password length must be greater than 11 characters \n \n"   
            this.setState(() => ({error}));
            return
        }
        if(passwordOne !== passwordTwo){
            error = "Passwords do not match. \n \n"
            this.setState(() => ({error}));
            return;     
        }
        console.log(mnemonic)

        var validMnemonic = bip39.validateMnemonic(mnemonic);

        if(!validMnemonic){
            error = "Invalid Mnemonic Phrase. \n \n"
            this.setState(() => ({error}));
            return;
        }

        var encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, passwordOne).toString();

        var hmac =  CryptoJS.HmacSHA256(encryptedMnemonic, CryptoJS.SHA256(passwordOne)).toString();
        
        //console.log(encryptedMnemonic);

        //console.log(hmac);

        localStorage.setItem("hotWallet", JSON.stringify({encryptedMnemonic: encryptedMnemonic, hmac: hmac}));

        var wallet = localStorage.getItem("hotWallet");

        console.log(JSON.stringify(wallet));

        this.setState(()=>({ CreateImport: false, Create: false, Import: false, Display: false, Unlock: true, mnemonic: "", error: ""}))
    }

    unlockWallet = async (password) =>{
        //if(this.state.password)
        console.log("unlock");
        var wallet = JSON.parse(localStorage.getItem('hotWallet'));

        //console.log(wallet["encryptedMnemonic"])

        // verify hmac
        var vhmac = CryptoJS.HmacSHA256(wallet["encryptedMnemonic"], CryptoJS.SHA256(password)).toString();

        //console.log(vhmac);
        //console.log(wallet["hmac"]);

        if(wallet["hmac"] !== vhmac){
            var error = "Incorrect Password or Wallet. Try password again or import wallet."
            this.setState(()=>({error}))
            return;
        }

        var decryptedMnemonic = CryptoJS.AES.decrypt(wallet["encryptedMnemonic"], password).toString(CryptoJS.enc.Utf8)
        //console.log(decryptedMnemonic);

        /*
        var seed = bip39.mnemonicToSeeddecrypted(decryptedMnemonic)

        var accountKey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        var account = web3.eth.accounts.privateKeyToAccount(accountKey._privateKey)*/

        this.initializeProviders()

        provider = new HDWalletProvider({mnemonic: decryptedMnemonic, providerOrUrl: providers["Mumbai"].url})

        web3  = new Web3(provider);

        //console.log(provider);

        this.setState({Display: true, Unlock: false})

        this.initializeWallet()
    }

    changeProvider = async (event, {value}) =>{

        console.log(value)

        console.log(event)
        
        var pkey = []
        for(var a in provider.wallets){
            pkey.push(provider.wallets[a].privateKey.toString('hex'))
        }

        //console.log(key)

        provider = new HDWalletProvider({privateKeys: pkey, providerOrUrl: value})

        web3 = new Web3(provider)

        await this.props.updateWeb3(web3, this.state.account);

        await this.retrieveInfo(this.state.account);

        
        this.setState({asset: networkData[provider.chainId].nativeCurrency.symbol , assetImage: networkSymbols[networkData[provider.chainId].chainName],
                       providerText: networkData[provider.chainId].chainName , providerValue: value})

        //console.log(provider)
        
    }

    initializeProviders = async () =>{
        var prov = []
        for(var a in providers){
            prov.push({key: a, text: a, value: providers[a].url})
        }
        console.log(prov)

        this.setState({providers: prov, providerPlaceholder: "Mumbai", asset: providers["Mumbai"].asset, assetImage: networkSymbols["Mumbai"] })
    }

    initializeWallet = async () =>{
        var accounts = await web3.eth.getAccounts();
        //.log(accounts)

        var account = accounts[0];

        for(var i=0; i< accounts.length; i++){
            var text = accounts[i].slice(0,5) + "..." + accounts[i].slice(38)
            accounts[i] = {key: accounts[i], text, value: accounts[i]}
        }

        var accountPlaceholder = account.slice(0,5) + "..." + account.slice(38);

        this.setState({accounts, account, accountPlaceholder})

        this.retrieveInfo(account);

        this.props.updateWeb3(web3, account);
    }

    changeAccount = async (event, {value}) =>{
        //console.log(value)
        this.setState(() => ({account: value}))
        await this.retrieveInfo(value)
        
        this.props.updateWeb3(web3, value);
    }

    retrieveInfo = async(account) =>{
        //console.log(account)

        var balance = await web3.eth.getBalance(account);

        balance = utils.fromWei(balance, "ether");

        this.setState({balance})
    }

    sendPrompt = () =>{
        this.setState({Display: false, Send: true})
    }
    
    backDisplay = () =>{
        this.setState({Display:true, Send: false})
    }

    backUnlock = () =>{
        if (localStorage.getItem("hotWallet") === null)
            this.setState({CreateImport: true, Import: false})
        else
            this.setState({Unlock: true, Import: false, Display:false})
    }

    render(){
        var content = this.state.CreateImport ? <CreatePrompt createWallet = {this.createWallet} importWallet = {this.importWallet}/> :
                      this.state.Create ? <Create methods = {{setWallet : this.setWallet,
                                                              setPasswordOne: this.setPasswordOne,
                                                              setPasswordTwo : this.setPasswordTwo,
                                                              backUnlock : this.backUnlock,
                                                            }}  {...this.state}/> :
                      this.state.Import ? <Import methods = {{setMnemomnic : this.setMnemomnic,
                                                              setWallet : this.setWallet,
                                                              backUnlock: this.backUnlock,
                                                              setPasswordOne: this.setPasswordOne,
                                                              setPasswordTwo : this.setPasswordTwo   
                                                            }} {...this.state}/> :
                      this.state.Unlock ? <Unlock unlockWallet = {this.unlockWallet} importWallet = {this.importWallet} {...this.state}/> : 
                      this.state.Display? <Display sendPrompt = {this.sendPrompt} changeAccount = {this.changeAccount} changeProvider= {this.changeProvider} backUnlock={this.backUnlock}{...this.state}/> : 
                      this.state.Send ? <Send back = {this.backDisplay} retrieveInfo = {this.retrieveInfo}  {...this.state}/> :<div></div>;

        return(
                <Card.Content>
                    {content}
                </Card.Content>
            )    
    }
}

class Send extends Component{
    constructor(props){
        super();
        this.props = props;
        this.state = {asset: null, recipient: null, amount: null, error: ""}
    }

    componentDidMount = () =>{
        this.setState({asset: "Matic"})
        //this.props.account
    }

    changeRecipient = async(event) =>{
        this.setState({recipient: event.target.value});
    }

    changeAmount = async (event) =>{
        //console.log(event.target.value);
        this.setState({amount: event.target.value})
    }

    setAmount = () =>{
        this.setState({amount: this.props.balance})
    }

    send = async () =>{
        this.setState({error:""})
        if(!utils.isAddress(this.state.recipient)){
            this.setState({error: "Invaild recipient address given. Cannot send transaction."})
            return;
        }

        if(!Number(this.state.amount) || !(Number(this.state.amount) < Number(this.props.balance))){
            //console.log(this.state.amount)
            this.setState({error: "Invalid amount entered."})
            return
        }

        var tx = {
            from: this.props.account, 
            to: this.state.recipient,
            value: utils.toWei(this.state.amount.toString(), "ether")
        }

        console.log(tx);

        this.setState({sending:true})

        var receipt =  await web3.eth.sendTransaction(tx)

        console.log(receipt)

        this.setState({sending:false})

        this.props.retrieveInfo(this.props.account);
    }

    render(){
        var sendButton = this.state.sending ? <Button secondary loading>Send</Button>: <Button secondary onClick={this.send}>Send</Button>
        return(
            <div id = "send">
                <div id='leftAlign'>
                    <div id="compHeader"> <button id="back" onClick ={this.props.back}><Icon size="large" name = "arrow left"/></button> <Header color="blue">Send {this.state.asset}</Header> </div>
                    <Divider/>
                    <Form inverted>
                        <Form.Input label="Recipient:" placeholder="0xCA7...Cd63" onChange={this.changeRecipient}/>
                        <Form.Input defaultValue={this.state.amount} onChange={this.changeAmount} label={<div className ="amountLabel">Amount: <button id="sendBalance" onClick={this.setAmount}><Icon name="balance"/>{this.props.balance}</button></div>} placeholder="0.000000">
                            <input />
                            <Label id = "assetLabel">{this.state.asset}</Label>
                        </Form.Input>
                        <div>{this.state.error}</div><br/>
                        {sendButton}
                    </Form>
                </div>
            </div>
        );
    }
}

class Display extends Component{
    constructor(props){
        super();
        this.props = props;
        this.state = {accounts: null, account: null, balance: null};
    }
    
    componentDidMount = async () =>{
        //web3.eth.getAccounts().then(console.log)

        console.log("display mount")
        
    }
    
    copyAccount = () =>{
        //console.log(this.state.account)
        navigator.clipboard.writeText(this.props.account);
    }

    updateQr = () =>{
        QRCode.toDataURL(this.props.account)
        .then(url => {
            console.log(url)
            this.setState({qrCode: url})
        })
        .catch(err => {
            console.error(err)
        })
    } 

    render(){
        return(
            <div id="display">
                <div id="compHeader"> <button id="back" onClick ={this.props.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div id="linkButton">Display</div></Header> </div>
                <div id ="networkDropdown">
                    <Dropdown button selection placeholder={this.props.providerPlaceholder} text={this.props.providerText} value={this.props.providerValue} options = {this.props.providers} onChange={this.props.changeProvider}></Dropdown>
                    <Icon name="globe"/>
                </div ><br/>
                <Divider />
                <Dropdown button selection placeholder={this.props.accountPlaceholder} options ={this.props.accounts} onChange = {this.props.changeAccount}/>
                <Popup content="Copied!" on='click' position="top right" offset={[20,10]} trigger = {<Icon name="copy" onClick={this.copyAccount}/>}/><br/><br/>
                <Image src = {this.props.assetImage} size = "mini" circular/>
                <Header inverted>{this.props.balance} {this.props.asset}</Header>
                <Button secondary onClick={this.props.sendPrompt}>Send</Button>
                <Popup on ='click' trigger = {<Button secondary onClick={this.updateQr}>Receive</Button>} content = {
                    <Image src = {this.state.qrCode} size="large"/> 
                } />
            </div>
        ) 
    }
}

class Unlock extends Component{

    //var decryptedMnemonic = CryptoJS.AES.decrypt(encryptedMnemonic, this.state.password).toString(CryptoJS.enc.Utf8);
        //console.log(decryptedMnemonic)

    constructor(props){
        super();
        this.props = props;
        this.state = {password: "", error:""}
    }

    componentDidMount() {
        //console.log("Unlock")
        //var encryptedMnemonic = localStorage.getItem("hotWallet");
    }

    setPassword =  async (event) =>{
        this.setState({password: event.target.value})
    }

    render(){
        return(
            <div id="unlock">
                <Image src={fire} size="tiny"/>
                <Header inverted>Unlock Wallet</Header><br/>
                <Divider/>
                <div  id="leftAlign">
                    <Form onSubmit={() => this.props.unlockWallet(this.state.password)} inverted>
                        <Form.Input label='Password:' placeholder='Passsword' type='password' onChange={this.setPassword} />
                        <div>{this.props.error}<br/><br/></div>
                        <Button color='black' onClick={() => this.props.unlockWallet(this.state.password)}><div id="linkButton">Unlock</div></Button><br/><br/><br/><br/>
                        <button id="linkButton" onClick={() => this.props.importWallet()}><b><u>Import</u> wallet using mnemonic.</b></button>
                    </Form>
                </div>
            </div>
            )
    }
}

class Import extends Component{

    state = {type: "password"}

    constructor(props){
        super();
        this.props = props;
        this.methods = this.props.methods;
    }

    componentDidMount(){
        //console.log(this.methods)
    }

    changeType = async (event) =>{
        if(this.state.type === "password"){
            this.setState({type: "text"})
            return;
        }
        this.setState({type: "password"})
    }

    render(){
        return(
            <div id = "import">
                <div id ="leftAlign">
                    <div id="compHeader"> <button id="back" onClick ={this.methods.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div id="linkButton">Import</div></Header> </div>
                    <Header inverted size="small">Import wallet using mnemonic.</Header><br/><br/>
                    <Form inverted onSubmit={this.methods.setWallet}>
                        <Form.Input label="Mnemonic Phrase:" type={this.state.type} onChange={this.methods.setMnemomnic}/>
                        <Form.Checkbox label = "Show Mnemonic." onChange={this.changeType}/><br/><br/>
                        <Form.Input label="Password:" placeholder="Password" type='password' onChange={this.methods.setPasswordOne}/>
                        <Form.Input label='Confirm Password:' placeholder='Confirm Password' type='password' onChange={this.methods.setPasswordTwo} />
                        <div style={{color: "white"}}>{this.props.error}</div><br/><br/>
                        <Button color="black" onClick={this.methods.setWallet}>Import Wallet</Button>
                    </Form>
                </div>
            </div>
        )
    }
}

class CreatePrompt extends Component{

    render(){
        return(
            <div id="createPrompt">
                <p>Hot Wallet was not found. Create or import hot wallet.</p>
                <Button color="black" onClick={this.props.createWallet}> Create </Button>
                <Button color="black" onClick={this.props.importWallet}> Import </Button>
            </div>
            )
    }
}

class Create extends Component{

    constructor(props){
        super();
        this.props = props;
        this.methods = this.props.methods;
    }

    copyMnemonic = () =>{
        navigator.clipboard.writeText(this.props.mnemonic)
    }

    render(){
        return(
            <div id="createWallet">
                <div id="leftAlign">
                    <div id="compHeader"> <button id="back" onClick ={this.methods.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div id="linkButton">Create</div></Header> </div><br/>
                    Mnemonic: <br/>
                    <Popup content="Copied!" on='click' position="top right"
                    trigger={<Segment inverted onClick={() => this.copyMnemonic()} id="MnemonicText">
                                <div>{this.props.mnemonic}</div>
                                <div style={{'width': '100%', 'text-align': 'right'}}><Icon name="copy"/></div>
                            </Segment>} />
                    <Form inverted onSubmit={() => this.methods.setWallet}>
                        <Form.Input label='Password:' placeholder='Passsword' type='password' onChange={this.methods.setPasswordOne} />
                        <Form.Input label='Confirm Password:' placeholder='Confirm Password' type='password' onChange={this.methods.setPasswordTwo} />
                        <div>{this.props.error}<br/><br/></div>
                        <Button color="black" onClick={() => this.methods.setWallet}>Create Wallet</Button>
                    </Form>
                </div> 
            </div>
            )
    }
}


export {CreatePrompt, Create, Import, Unlock, Display, Send}

export default HotWallet
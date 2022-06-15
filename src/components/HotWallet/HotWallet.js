import React, {Component} from "react";

import {Card} from 'semantic-ui-react';

import "./HotWallet.css";

import polygonImage from "../../logos/wallet/chains/polygonSymbol.jpg";

import mumbaiImage from "../../logos/wallet/chains/polygonMumbai.png"

import ganacheImage from "../../logos/wallet/chains/ganache.png";

import kovanImage from "../../logos/wallet/chains/kovan.png";

import CreatePrompt from "./components/CreatePrompt"

import Create from "./components/Create"

import Import from "./components/Import";

import Unlock from "./components/Unlock";

import Display from "./components/Display";

import Send from "./components/Send";

import About from "./components/About";

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
                      walletAccounts: null, account: null, accountPlaceholder: null, balance: null,
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
        this.aboutPrompt = this.aboutPrompt.bind(this)
        this.initializeNetworkData = this.initializeNetworkData.bind(this);
        this.initializeWallet = this.initializeWallet.bind(this);
        this.changeProvider = this.changeProvider.bind(this);
        this.test = false;
    }

    componentDidMount = async() => {

        //console.log(this.props.loadWallet)

        this.wallet = this.props.wallet;

        //console.log(this.props);

        if(this.test){
            //await this.unlockWallet("password1234")
            this.wallet.unlockWallet("password1234", "80001")
            return
        }

        var cookie = this.wallet.retrieve();
        //console.log(`cookie: ${cookie}`);

        if(cookie === null){
            this.setState({CreateImport: true})
            return;
        }
        else{
            //localStorage.removeItem("hotWallet")
            if(this.wallet.unlocked){
                /*
                web3 = this.props.web3;
                provider = this.props.web3.currentProvider;
                console.log(`Hotwallet provider : ${provider.chainId}`)*/
                this.setState({Display: true})
                return;
            }
            this.setState({Unlock: true});
            //this.setState({About:true})
            //
            return;
        }
    }

    componentDidUpdate = (prevProps) =>{
        this.wallet = this.props.wallet;
    }
    
    createWallet = () =>{
        this.setState(()=>({CreateImport: false, Create: true, mnemonic: this.wallet.createMnemonic()}))
    }
    
    importWallet = () =>{
        this.setState(()=>({CreateImport: false, Display: false, Create: false, Import: true}))
    }

    setMnemomnic = async (event) =>{
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
            error = "Password length must be greater than 11 characters. \n \n"   
            this.setState(() => ({error}));
            return
        }
        if(passwordOne !== passwordTwo){
            error = "Passwords do not match. \n \n"
            this.setState(() => ({error}));
            return;
        }
        console.log(mnemonic)

        this.wallet.setWallet(mnemonic, passwordOne);

        console.log(JSON.stringify(this.wallet.retrieve()));

        this.setState(()=>({ CreateImport: false, Create: false, Import: false, Display: false, Unlock: true, mnemonic: "", error: ""}))
    }

    unlockWallet = async (password) =>{
        console.log("unlock");

        var network = this.props.network

        if(network === null){
            network = "80001"
        }

        this.wallet.unlockWallet(password, network);

        this.setState({Display: true, Unlock: false})

        await this.props.updateWallet(this.wallet);
    }

    changeProvider = async (event, {value}) =>{

        this.wallet.changeProvider(value)

        await this.props.updateWallet(this.wallet);

        await this.retrieveInfo(this.state.account);
    }

    initializeNetworkData = async () =>{
        var networks = []
        var networkData = this.wallet.getNetworkData();
        //console.log(networkData);
        var network = this.props.network !== null ? this.props.network : "80001"

        console.log(network)
        
        var currentNetwork;

        for(var n of networkData){
            console.log(n);
            if(n.id === network){
                currentNetwork = n;
            }
            networks.push({key: n.name, text: n.name, value: n.id})
        }

        console.log(currentNetwork)

        this.setState({networks, providerPlaceholder: currentNetwork.name, asset: currentNetwork.asset, assetImage: networkSymbols[currentNetwork.name]})
    }


    initializeWallet = async () =>{

        var accounts = this.wallet.accounts;

        //console.log(accounts)

        var walletAccounts = []

        var account = this.wallet.account;
        
        for(var i=0; i < accounts.length; i++){
            var text = accounts[i].slice(0,5) + "..." + accounts[i].slice(38)
            walletAccounts[i] = ({key: accounts[i], text, value: accounts[i]})
        }

        var accountPlaceholder = account.slice(0,5) + "..." + account.slice(38);

        //console.log(walletAccounts)

        console.log(this.wallet.accounts)

        this.setState({walletAccounts, account, accountPlaceholder})

        this.retrieveInfo(account);
    }

    changeAccount = async (event, {value}) =>{

        this.wallet.changeAccount(value)

        this.setState(() => ({account: value}))

        await this.retrieveInfo()

        this.props.updateWallet(this.wallet);
    }

    retrieveInfo = async() =>{
        var balance = await this.wallet.getBalance();

        balance = Number(this.wallet.utils.fromWei(balance, "ether")).toFixed(8);

        this.setState({balance})
    }

    sendPrompt = () =>{
        this.setState({Display: false, Send: true})
    }
    
    backDisplay = () =>{
        this.setState({Display:true, Send: false})
    }

    backUnlock = () =>{
        if (this.wallet.retrieve() === null)
            this.setState({CreateImport: true, Import: false})
        else
            this.setState({Unlock: true, Import: false, Display: false, About: false})
    }

    aboutPrompt = () =>{
        this.setState({About: true, Unlock: false})
    }

    methods = () =>{
        return {
            
        }
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
                      this.state.Unlock ? <Unlock unlockWallet = {this.unlockWallet} importWallet = {this.importWallet} aboutPrompt={this.aboutPrompt} handleClose={this.props.handleClose} {...this.state}  /> : 
                      this.state.Display? <Display sendPrompt = {this.sendPrompt} changeAccount = {this.changeAccount} changeProvider= {this.changeProvider}
                                                     initializeNetworkData={this.initializeNetworkData}
                                                     backUnlock={this.backUnlock}
                                                     initializeWallet = {this.initializeWallet} {...this.state} {...this.props}/> : 
                      this.state.Send ? <Send back = {this.backDisplay} retrieveInfo = {this.retrieveInfo}  {...this.state} {...this.props}/> :
                      this.state.About ? <About backUnlock={this.backUnlock}/> : <div></div>;

        return(
                <Card.Content>
                    {content}
                </Card.Content>
            )    
    }
}

export default HotWallet
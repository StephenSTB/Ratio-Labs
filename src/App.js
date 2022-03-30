import React, { Component, version } from "react";
import 'semantic-ui-css/semantic.min.css';

import Web3 from "web3";

import './App.css';

import TopBar from "./components/TopBar/TopBar";

import Main from "./components/Main/Main";

import {BrowserRouter} from "react-router-dom";

import { Button, Dimmer, Header, Image, Segment } from 'semantic-ui-react'

import * as IPFS from "ipfs";

import networkData from "./data/Network_Data.json";

import mumbai from "./logos/wallet/chains/polygonMumbai.png";

import polygon from "./logos/wallet/chains/polygon.png";

import ganache from "./logos/wallet/chains/ganache.png";

import kovan from "./logos/wallet/chains/kovan.png";

var images  = {
                  "80001": mumbai,
                  "137": polygon,
                  "1337": ganache,
                  "42": kovan
              }

class App extends Component{

  constructor(){
    super();
    this.state = {selectedAccount: "Connect Wallet", network: null, networkHex: networkData["80001"].chainId  ,selectedProviderImage: images["80001"], unlocked: false, loading: false}
    this.updateWeb3 = this.updateWeb3.bind(this);
    this.setProvider = this.setProvider.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.test = true;
  }

  componentDidMount = async () =>{

    console.log(global.ipfs)

    if(global.ipfs === undefined){
      global.ipfs = await IPFS.create();

      var version = await global.ipfs.version();

      console.log(version.version)
     
    }
    
    if (window.ethereum) {
      const web3  = new Web3(window.ethereum);
      const network = await web3.eth.getChainId();
      await this.setProvider(network.toString())
    }
  }

  setLoading = (loading) =>{

    //console.log("loading triggered");

    this.setState({loading})

  }
 
  getProvider = (network) =>{

    console.log(network)

    switch(network){
        case network === "1337":
          return "development"
        default :
          return"development"
    }
  }

  setProvider = async (network) =>{

      if(networkData[network] !== undefined){
        
        var networkHex = networkData[network].chainId;
        var selectedProviderImage = images[network]

        console.log(networkHex)
  
        this.setState({network, networkHex, selectedProviderImage});
      }
  }

  updateWeb3 = async (web3, account) =>{

    //console.log("web3" + web3)
    if(web3 != null){
      
      const accounts = await web3.eth.getAccounts();

      const selectedAccount = account.slice(0,5) + "..." + account.slice(38); 
      
      const network = await web3.eth.getChainId();

      await this.setProvider(network.toString())

      var unlocked = true

      //this.getProvider(network);

      this.setState({web3, accounts, account, network, selectedAccount, unlocked});
      return;
    }

    if (window.ethereum) {

      try{
        await window.ethereum.request({method: 'eth_requestAccounts'});
      }
      catch(error){
        console.error(error);
        return;
      }
      const web3  = new Web3(window.ethereum);

      //console.log(web3.eth.accounts)

      const accounts = await web3.eth.getAccounts();

      const account = accounts[0];

      const selectedAccount = account.slice(0,5) + "..." + account.slice(38);
      
      const network = await web3.eth.getChainId();

      console.log(network)
      
      try{
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.state.networkHex }],
        });
      }
      catch(swtichError){
        if(swtichError.code === 4902){
          try{
            window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: networkData[network],
            });
          }
          catch(error){
            console.log(error)
          }
        }
      }

      //var provider = this.getProvider(network);
      
      this.setState({web3, accounts, account, network, selectedAccount});

      //console.log("state" + this.state.network)

      window.ethereum.on('accountsChanged', (accounts) => {
        // Handle the new accounts, or lack thereof.
        // "accounts" will always be an array, but it can be empty.
        this.updateWeb3(null);
      });


      window.ethereum.on('chainChanged', (chainId) => {
        // Handle the new chain.
        // Correctly handling chain changes can be complicated.
        // We recommend reloading the page unless you have good reason not to.
        //window.location.reload();
      });
      
    }
  }

  render(){
    return (
      <div className="App">
        <BrowserRouter>
          <TopBar {...this.state} updateWeb3 = {this.updateWeb3} setProvider ={this.setProvider} setLoading = {this.setLoading}/>
          <Main {...this.state} setLoading = {this.setLoading}/>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;

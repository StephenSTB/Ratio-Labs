import React, { Component} from "react";

import { createMedia } from '@artsy/fresnel';

import 'semantic-ui-css/semantic.min.css';

import Web3 from "web3";

import './App.css';

import TopBar from "./components/TopBar/TopBar";

import Main from "./components/Main/Main";

import {BrowserRouter} from "react-router-dom";

import networkData from "./data/Network_Data.json";

import deployedContracts from "./data/Deployed_Contracts.json"

import * as contract from "@truffle/contract";

import RatioSingleNFT from './contracts/RatioSingleNFT.json';

import NFTProtocol from './contracts/NFTProtocol.json';

import mumbai from "./logos/wallet/chains/polygonMumbai.png";

import polygon from "./logos/wallet/chains/polygon.png";

import ganache from "./logos/wallet/chains/ganache.png";

import kovan from "./logos/wallet/chains/kovan.png";

import * as IPFS from 'ipfs-core';

const { MediaContextProvider, Media } = createMedia({
  breakpoints: {
    mobile: 0,
    tablet: 768,
    computer: 1024,
  },
})


var images  = {
                  "80001": mumbai,
                  "137": polygon,
                  "1337": ganache,
                  "42": kovan
              }

class App extends Component{

  constructor(){
    super();
    this.state = {selectedAccount: "Connect Wallet", network: null, networkHex: networkData["80001"].chainId  ,selectedProviderImage: images["80001"], unlocked: false, loading: false,
                    NFTProtocol: null, RatioSingleNFT: null,
                    networkError: ""
                    
                  }
    this.updateWeb3 = this.updateWeb3.bind(this);
    this.setProvider = this.setProvider.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.test = true;

    this.RatioSingleNFT = contract(RatioSingleNFT)
    this.NFTProtocol = contract(NFTProtocol);

  }

  componentDidMount = async () =>{

    console.log(global.ipfs)

    if(global.ipfs === undefined){
      
      try{
        
        global.ipfs = await IPFS.create({
          repo: 'ipfs-browser', // Math.random()
          /*
          config: {
            Addresses: {
              Swarm: [
                '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                '/dns4/localhost/tcp/13579/ws/p2p-webrtc-star/',
              ]
            },
            Bootstrap: []
          },*/
          start: false
        });

        console.log(global.ipfs)

      }catch(err){
        console.log(err)
      }
     
    }
    
    if (window.ethereum) {
      this.updateWeb3(null);
    }
  }

  componentDidUpdate = async (prevProps, prevState) =>{
  
  }

  setLoading = (loading) =>{

    //console.log("loading triggered");

    this.setState({loading})

  }

  setProvider = async (web3, network) =>{

      if(networkData[network] !== undefined){
        console.log("App Setting Provider")
        
        var networkHex = networkData[network].chainId;
        var selectedProviderImage = images[network]

        console.log(networkHex)

        this.RatioSingleNFT.setProvider(web3.currentProvider)

        this.NFTProtocol.setProvider(web3.currentProvider);

        this.setState({network, networkHex, selectedProviderImage, RatioSingleNFT: this.RatioSingleNFT, NFTProtocol: this.NFTProtocol, networkError: ""});
        return;
      }

      this.setState({networkError: "The current network is unsupported. Switch to a supported network."})
      console.log("App current network is Unsupported.")

  }

  updateWeb3 = async (web3, account) =>{

    //console.log("web3" + web3)
    if(web3 != null){
      
      const accounts = await web3.eth.getAccounts();

      const selectedAccount = account.slice(0,5) + "..." + account.slice(38); 
      
      const network = await web3.eth.getChainId();

      const utils = web3.utils;

      await this.setProvider(web3, network.toString())

      var unlocked = true

      this.setState({web3, utils, accounts, account, network, selectedAccount, unlocked});
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

      const utils = web3.utils;

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

      this.setProvider(web3, network,toString());
      
      this.setState({web3, utils, accounts, account, network, selectedAccount});

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
        this.updateWeb3(null);
      });
      
    }
  }

  render(){
    return (
      <div >
        <BrowserRouter >
            <TopBar {...this.state} updateWeb3 = {this.updateWeb3} setProvider ={this.setProvider} setLoading = {this.setLoading}/>
            <Main {...this.state} setLoading = {this.setLoading}/>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;

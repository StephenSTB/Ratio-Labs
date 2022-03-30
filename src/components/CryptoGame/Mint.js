import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Container, Image, Segment, List, Menu, Dropdown} from 'semantic-ui-react';

import * as IPFS from "ipfs";

import nft_cids from "../../data/NFT_CID.json"

import deployedContracts from "../../data/Deployed_Contracts.json";

class Mint extends Component{
    constructor(props){
        super();
        this.props = props;

        this.state = {  options: null,
                        nftImage: "https://gateway.ipfs.io/ipfs/QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ",
                        nftAddress: "0x..."
        }
    }

    componentDidMount= async() =>{

      var options = [];

      console.log(this.props.provider);

      if(this.props.provider !== undefined){
        for(var c in deployedContracts[this.props.provider]){

            var val = {address: deployedContracts[this.props.provider][c]["address"], uri:"https://ipfs.io/ipfs/" + deployedContracts[this.props.provider][c]["uri"].slice(7)}
           
            options.push({key: c, text: c, value: val})
         }
   
         this.setState({nftImage: options[0].value.uri , nftAddress: options[0].value.address, options: options})
      }
      
    }

    componentDidUpdate = async () =>{

    }

    changeNFT = async (event,{value}) =>{

        
        console.log(value.uri)
        this.setState(() => ({nftImage: value.uri, nftAddress: value.address}))
    }

    render(){

        return(
            <div id="MintComponent">
                <Segment basic inverted id="MintBanner" style={{"margin-top": "auto", height: "25vh"}}>
                    <Container textAlign="left">
                        <div id="MintText">Mint</div>
                    </Container>
                </Segment>
                <div id="MintSection" style={{"padding-top":"6vh"}}>
                    <Container id="MintInterface" text textAlign="left">
                        <Dropdown button placeholder="Select NFT" selection fluid options={this.state.options} onChange ={this.changeNFT} id="Dropdown"/>
                        <Image src={this.state.nftImage} style={{margin: "auto", padding: "2vh"}} />
                    </Container>
                </div>
            </div>
        );
    }
}

export default Mint;
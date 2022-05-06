import React, { Component } from "react";

import 'semantic-ui-css/semantic.min.css';

import {Container, Segment, Button, Loader, Card, Menu} from 'semantic-ui-react';

import  "@google/model-viewer";

import deployedContracts from "../../data/Deployed_Contracts.json"

import networkData from "../../data/Network_Data.json"

import * as contract from "@truffle/contract";

import RatioSingleNFT from '../../contracts/RatioSingleNFT.json';

import NFTProtocol from '../../contracts/NFTProtocol.json';

class Display extends Component{

    constructor(props){
        super(props)
        this.state = {}
        this.RatioSingleNFT = this.props.RatioSingleNFT

        this.NFTProtocol = this.props.NFTProtocol;
    }

    componentDidMount = async () =>{

        if(this.NFTProtocol === null){
            return;
        }

        await this.getNFTinfo();
    }

    componentDidUpdate = async (prevProps) =>{

        //console.log("compUpdate")

        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !=="")
            return;

        if(prevProps.web3 !== this.props.web3){
            this.RatioSingleNFT = this.props.RatioSingleNFT;
            this.NFTProtocol = this.props.NFTProtocol;
            await this.getNFTinfo();
            return;
        }
        if(this.state.nfts === undefined){
            await this.getNFTinfo();
        }
    }

    getNFTinfo = async () =>{
        console.log("NFT INFO")
        var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;
        this.nftProtocol = await this.NFTProtocol.at(protocolAddress);

        console.log("Retrived nft protocol.")
        var nftProtocol = this.nftProtocol;

        var nftContracts = await nftProtocol.getDistributorContracts(this.props.account);

        console.log("Retrived nft contracts.")

        if(nftContracts.length === 0){
            this.setState({nft: null})
            return;
        }

        console.log(`contracts: ${nftContracts}`);

        var nfts = []

        for(var c of nftContracts){
            //nftInfo.push(nftProtocol.getContractNFT(c))
            var contract = await this.RatioSingleNFT.at(c);

            var info = await contract.info();

            var content = [info._image, info._audio, info._video, info._model]

            for(var i = 0; i < content.length; i++){
                if(content[i] === ""){
                    content = content.splice(i, 1)
                    i--;
                }
            }


            console.log(`nft content: ${content.length}`);

            nfts.push({info})
        }

        this.setState({nfts})
        this.mainNFTs()
    }

    updateNFTs(){

    }

    mainNFTs = () =>{
        var mainNFTs = <p></p>

        if(this.props.account === undefined){
            mainNFTs = <p style = {{"font-size": "x-large"}}>Connect Wallet to Display your NFTs.</p>;
        }
        else if(this.state.nfts === undefined){
            mainNFTs = <Loader active size="huge" inline center>Loading...</Loader>
        }
        else if(this.state.nfts === null){
            mainNFTs = <div>
                            <p style = {{"font-size": "x-large"}}>You have no NFTs to Display. </p>
                            <p style = {{"font-size": "x-large"}}>Use the Create section to build your first NFT!</p>
                        </div>
        }
        else{
            mainNFTs = this.state.nfts.map((nft, i) =>(
                            <Card id="nftBox" key={i}>
                                <Card id="nftContent" style={{"marginTop" : "50px"}}>
                                    
                                </Card>
                                <Card.Content extra id="nftMenu">
                                    <Menu>
                                        
                                    </Menu>
                                </Card.Content>
                                <Card.Content >
                                    <Card.Header><p id = "nftInfo">{nft.info._name} </p></Card.Header>
                                    <Card.Description>
                                        <div id = "nftInfo">
                                            <p>Price: {this.props.utils.fromWei(nft.info._mintValue, "ether")}</p>
                                            <p>Max Supply: {nft.info._maxSupply.toString()}</p>
                                            <p>Minted: {nft.info._minted.toString()}</p>
                                        </div>
                                    </Card.Description>
                                </Card.Content>
                            </Card>
                        ))
        }
        this.setState({mainNFTs});
    }

    render(){

        return(
            <div id="mainComponent">
                <Segment basic inverted id="banner" style={{"marginTop": "auto", height: "25vh"}}>
                        <Container textAlign="left">
                            <div id="bannerText">Display</div>
                        </Container>
                </Segment>
                <Container style={{"padding-top": "6vh", color:"black",}} textAlign="center">
                    <div id="nftContainer">
                        {this.state.mainNFTs}
                    </div>
                </Container>
            </div>
        );
    }
}

export default Display;

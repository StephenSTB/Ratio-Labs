import React, { Component } from "react";

import 'semantic-ui-css/semantic.min.css';

import {Container, Segment, Button, Loader, Menu, Popup, Icon, Input, Divider, Form} from 'semantic-ui-react';

import  "@google/model-viewer";

import deployedContracts from "../../data/Deployed_Contracts.json"

import networkData from "../../data/Network_Data.json"

import * as axios from 'axios';

import "./NFT.css"

class Display extends Component{

    constructor(props){
        super(props)
        this.state = {searchError: ""}
        this.RatioSingleNFT = this.props.RatioSingleNFT
        this.NFTProtocol = this.props.NFTProtocol;
    }

    componentDidMount = async () =>{

        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== "")
            return;

        if(this.NFTProtocol === null || this.NFTProtocol === undefined){
            return;
        }
        

        var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;
        this.nftProtocol = await this.NFTProtocol.at(protocolAddress);

        let {searchContract} = this.props.match.params;

        if(this.props.utils.isAddress(searchContract)){
            this.setState({searchContract})
            await this.searchNFT();
        }

        this.mainNFTs()
        await this.getNFTinfo();

        this.updateNFT = this.updateNFT.bind(this);
    }

    componentDidUpdate = async (prevProps) =>{

        console.log("Display Component Update")

        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== "" || prevProps === undefined)
            return;


        if(prevProps.web3 !== this.props.web3){
            this.RatioSingleNFT = this.props.RatioSingleNFT;
            this.NFTProtocol = this.props.NFTProtocol;
            var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;
            this.nftProtocol = await this.NFTProtocol.at(protocolAddress);
            try{
                await this.getNFTinfo();
            }catch(e){
                console.log(e)
            }
            
            return;
        }
        //console.log(this.state.nfts)
        if(this.state.nfts === undefined){
            try{
                await this.getNFTinfo();
            }catch(e){
                console.log(e);
            }
        }
    }

    getNFTinfo = async () =>{
        console.log("NFT INFO")
        
        //console.log("Retrived nft protocol.")
        var nftProtocol = this.nftProtocol;

        //console.log(this.props.account)

        var nftContracts = await nftProtocol.getDistributorContracts(this.props.account);

        console.log("Retrived nft contracts.")

        if(nftContracts.length === 0){
            this.setState({nfts: null})
            this.mainNFTs();
            return;
        }

        console.log(`contracts: ${nftContracts}`);

        var nfts = []

        for(var c of nftContracts){

            var nftObj = await this.createNFTObj(c)

            nfts.push(nftObj)
        }

        console.log("Set nfts")

        this.setState({nfts})
        this.mainNFTs()
    }

    createNFTObj = async (address) =>{
        var contract = await this.RatioSingleNFT.at(address);

        var _info = await contract.info();

        var info = {}

        for(var i in _info){
            if(isNaN(i)){
                info[i] = _info[i]
            }
        }
        console.log(info)

        info._contract = contract;

        // get open sea approval status 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE

        info._address = address.slice(0,5) + "..." + address.slice(38);

        info._baseText = info._base.slice(0,13) + "..." + info._base.slice(47);

        var content = [{type: "image", src: info._image.replace("ipfs://", "ipfs.io/ipfs/"), active: false}, {type: "audio", src: info._audio.replace("ipfs://", "ipfs.io/ipfs/"), active: false}, 
                        {type: "video", src: info._video.replace("ipfs://", "ipfs.io/ipfs/"), active: false}, {type: "model", src: info._model.replace("ipfs://", "ipfs.io/ipfs/"), active: false}]

        //console.log(content[0].src)

        for(i = 0; i < content.length; i++){
            if(content[i].src === ""){
                content.splice(i, 1)
                i--;
                continue;
            }
            content[i].src = "https://" + content[i].src;
        }

        console.log(`${content[0]}`)

        content[0].active = true;

        var display = content[0].type === "image" ? 
                        <img src={content[0].src}  id="uploadedContent" alt=""/> :
                      content[0].type === "audio" ? 
                        <audio id="uploadedContent" controls="Pause, Play"> <source src={content[0].src} /></audio> :
                      content[0].type === "video" ? 
                        <video id="uploadedContent" autoPlay muted> <source src={content[0].src} /></video> :
                      content[0].type === "model" ?
                        <model-viewer id="uploadedContent" src={content[0].src} camera-controls/> : <div></div>


        console.log('https://ipfs.io/ipfs/' + info._base.replace("ipfs://", ""))

        var details = false;
        
        //console.log(`nft content: ${JSON.stringify(content)}`);
        
        return {info, content, display, details}
    }

    createNFTCard = (nftObj, index, section) =>{

        var nftCard =   <div id="nftBox" key={index} >
                            <div id="nftContentDisp">
                                {nftObj.display}
                            </div>
                            <div id="nftMenu">
                                <Menu color="teal" inverted widths={4}>
                                    {nftObj.content.map((content, j) =>(
                                        <Menu.Item style={{color:"white"}} active={content.active} onClick={() => this.updateNFT({nftIndex: index, mediaIndex: j, nftObj, section, details: nftObj.details})}>{content.type}</Menu.Item>
                                    ))}
                                </Menu>
                            </div>
                            <Divider className="nftDivider"/>
                            <div>
                                <div className="nftHeader">{nftObj.info._name} </div>
                                <div className="nftDetails">
                                    {nftObj.details ? <Icon name="chevron up" className="infoButton" onClick={() => this.updateNFT({nftIndex: index, mediaIndex: null, nftObj, section, details: false})}/> : <Icon name="chevron down" className="infoButton" onClick={() => this.updateNFT({nftIndex: index, mediaIndex: null, nftObj, section, details: true})}/>}
                                    {nftObj.details ? 
                                        <div>
                                            <Segment className="nftInfo" attached="bottom" >
                                                <div className="infoElement"><div className="infoName">Contract:</div><div className="infoValue" onClick={() => this.copyContract(nftObj.info._contract.address)}>{nftObj.info._address} <Popup content="Copied!" on='click' position="right center" trigger = {<Icon name="copy"/>}/></div></div>
                                                <div className="infoElement"><div className="infoName">Base URI:</div><div className="infoValue"><a href={nftObj.info._base}>{nftObj.info._baseText}</a></div></div>
                                                <div className="infoElement"><div className="infoName">Price:</div><div className="infoValue">{this.props.utils.fromWei(nftObj.info._mintValue, "ether")}</div></div>
                                                <div className="infoElement"><div className="infoName">Claim Value:</div><div className="infoValue">{this.props.utils.fromWei(nftObj.info._claimValue, "ether")}</div></div>
                                                <div className="infoElement"><div className="infoName">Burnable:</div><div className="infoValue">{nftObj.info._burnable ? "yes" : "no"}</div></div>
                                                {nftObj.info._burnable ? <div className="infoElement"><div className="infoName">Burn Value:</div><div className="infoValue">{this.props.utils.fromWei(nftObj.info._burnValue, "ether")}</div></div> : <div></div>}
                                                <div className="infoElement"><div className="infoName">Max Supply:</div><div className="infoValue">{nftObj.info._maxSupply.toString()}</div></div>
                                                <div className="infoElement"><div className="infoName">Minted:</div><div className="infoValue">{nftObj.info._minted.toString()}</div></div>
                                                {Number(nftObj.info._claimValue) > 0 ? <div className="infoElement"><div className="infoName">Unclaimed:</div><div className="infoValue">{nftObj.info._unclaimed}</div></div> : <div></div>}
                                            </Segment>
                                            <div className="detailButtons">
                                                {nftObj.info._minted === "0" ? this.state.initLoad ? <Button className="initMint" loading>Loading</Button> : <Button className="initMint" centered secondary onClick={() => this.mint}>Initial Mint &nbsp; <Popup content="Be the first to mint your NFT! (Needed for Opensea integration)." trigger={<Icon name="question circle"/>  } /></Button> : <div/>}
                                            </div>
                                        </div>
                                    :
                                    <div></div>
                                }
                                    
                                    
                                </div>
                            </div>
                        </div>

        return nftCard;
    }

    updateNFT = (nft) =>{
        console.log("updateNFT!")

        var {nftIndex, mediaIndex, nftObj, section, details} = nft;

        nftObj.details = details;

        //console.log(JSON.stringify(nft.content))

        if(mediaIndex !== null){
            var content = nftObj.content;

            for(var c of content){
                c.active = false;
            }

            content[mediaIndex].active = true;
            
            var display = content[mediaIndex].type === "image" ? 
                                <img src={content[mediaIndex].src}  id="uploadedContent" alt=""/> :
                        content[mediaIndex].type === "audio" ? 
                                <audio id="uploadedContent" controls="Pause, Play"> <source src={content[mediaIndex].src} /></audio> :
                        content[mediaIndex].type === "video" ? 
                                <video id="uploadedContent" autoPlay muted> <source src={content[mediaIndex].src} /></video> :
                        content[mediaIndex].type === "model" ?
                                <model-viewer id="uploadedContent" src={content[mediaIndex].src} camera-controls/> : <div></div>

            nftObj.display = display;
        }

        
        //console.log(JSON.stringify(nft.content))

        if(section === "main"){
            var nfts = this.state.nfts;

            nfts[nftIndex] = nftObj;

            this.setState({nfts})
            
            var nftCard = this.createNFTCard(nftObj, nftIndex, "main");

            var mainNFTs = this.state.mainNFTs;

            mainNFTs[nftIndex] = nftCard;

            this.setState({mainNFTs});
        }

        if(section === "search"){
            var searchNFT = this.createNFTCard(nftObj, nftIndex, "search");

            this.setState({searchNFT})
        }
        
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
            mainNFTs = this.state.nfts.map((nftObj, i) =>(
                            this.createNFTCard(nftObj, i, "main")
                        ))
        }
        this.setState({mainNFTs});
    }
    
    copyContract = (address) =>{
        //console.log(`copy: ${address}`)
        navigator.clipboard.writeText(address);
    }

    searchChange = (e, data) =>{
        var searchContract = data.value;
        this.setState({searchContract});
    }

    searchNFT = async() => {
        console.log("search")
        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== "")
            return;
        
        if(!this.props.utils.isAddress(this.state.searchContract)){
            this.setState({searchError: "Given search address was invalid."})
            return;
        }
        try{

            var nftProtocol = this.nftProtocol;

            console.log(nftProtocol)

            var contractNFT = await nftProtocol.getContractNFT(this.state.searchContract)

            console.log(contractNFT);

            if(contractNFT._block === '0'){
                this.setState({searchError: "Given search address is not verified by the Ratio NFT Protocol."})
                return;
            }

            var nftObj = await this.createNFTObj(this.state.searchContract);

            console.log(nftObj)

            var searchNFT = this.createNFTCard(nftObj, 0 , "search");

            this.setState({searchNFT})

        }catch(e){
            console.log(e)
        }
        
    }

    render(){

        return(
            <div id="subComponent">
                <Segment basic inverted id="banner" style={{height: "25vh"}}>
                        <Container textAlign="left">
                            <div id="bannerText">Display</div>
                            <p id="bannerSub">Non-Fungible Tokens.</p>
                        </Container>
                </Segment>
                <div id="networkError">{this.props.networkError}</div>
                <Container id="searchContainer">
                    <div id="searchDiv">
                        <Form onSubmit={() => this.searchNFT()}>
                            <Input id="searchBar" icon={<Icon inverted name="search" circular link onClick={() => this.searchNFT()}></Icon>}  placeholder='Search for Contract 0x...' fluid onChange={this.searchChange}/>
                        </Form>
                    </div>
                    <div id="searchError">{this.state.searchError}</div>
                    <div id="nftContainer">
                        {this.state.searchNFT}
                    </div>
                </Container>
                <Divider></Divider>
                <div id="nftContainer">
                    {this.state.mainNFTs}
                </div>
            </div>
        );
    }
}

export default Display;

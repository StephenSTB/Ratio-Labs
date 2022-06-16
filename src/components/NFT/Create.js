import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Container, Segment, Form, Icon, Button, Dropdown, Divider, Menu, Input, Radio, Popup, TextArea} from 'semantic-ui-react';

import  "@google/model-viewer";

import deployedContracts from "../../data/Deployed_Contracts.json"

import networkData from "../../data/Network_Data.json"

import * as nftGatewayAPI from "./nftGatewayAPI.js";

import { MerkleTree } from 'merkletreejs';

import * as keccak256 from 'keccak256';

import * as mime from 'mime-types';

var gatewayApi;

var prod = false;

var host;

var uri_ext = ["jpg", "jpeg", "png", "gif", "svg", "mp3", "mpga", "wav", "ogg", "oga", "mp4", "webm", "glb", "gltf"];

var max_size = 100_000_000;

class Create extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {content: [<label for="fileDialog" id="dropLabel" onDrop={this.drop} onDragOver={this.allowDrop}>
                                    <div id="addIcon">
                                        <Icon name="plus square outline" size="huge"></Icon>
                                    </div>
                                    <div id="addIcon" >(Image, Video, Audio, or Model)</div>
                                </label>], contentType: [], files: [],
                        contentButtons: null, addSection: true, contentError: null,
                        animation_url: null, animation_type: null,
                        name: "", description: "",
                        attributes:[],
                        options:[{key: "number", text:"Number", value:"number"}, {key:"string", text:"Word", value:"string"}, ],
                        createLoading: false,
                        burnable: false,
                        createError: "",
                        displayFinalContent: null,  
                        displayFinalInfo: null,
                      }

        host = prod ? "https://ratiomaster.site" : "http://localhost:3002";

        //console.log({nftGatewayAPI})

        gatewayApi = new nftGatewayAPI(host);
    
        this.addContent = this.addContent.bind(this);
    }

    componentDidMount = async () =>{
        console.log(this.props.networkError)
    
        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== ""){
            return;   
        }
        
        /*this.NFTProtocol.setProvider(this.props.web3.currentProvider)*/

        //console.log(`NFTProtocol address: ${deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address}`)
    }

    componentDidUpdate = async (prevProps) =>{

        //console.log("update")
        
        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== "" || prevProps === undefined)
        {
            return;
        }

    }

    addContent = (file) =>{

        var curSize = 0;
        for(var f of this.state.files){
            curSize += f.size;
        }

        if(curSize + file.size > max_size){
            this.setState({contentError: `Could not add file: ${file.name} because content size would exceed 100MB.`});
            return;
        }
        
        const reader = new FileReader();

        console.log(file.name)

        var type;

        var ext = mime.extension(file.type);

        console.log(ext);

        if(ext === false){
            var filenameParse = file.name.split(".");
            ext = filenameParse[filenameParse.length - 1];
            type = ext === "gltf" ? "model" : ext === "glb" ? "model" : null;
        }else if(!uri_ext.includes(ext)){
            this.setState({contentError: `Invalid file ext: ${ext}`});
            return
        }

        if(type === undefined){
            type = (file.type.split("/"))[0];
        }

        console.log(type)
        
        if(type === null){
            this.setState({contentError: "Unsupported file type."})
            return
        }

        if(this.state.contentType.includes(type)){
            var error = "A " + type + " has already been added. Only one content object per type is allowed."
            this.setState({contentError: error})
            return;
        }
                 
        reader.addEventListener('load', (event) => {
            var content = this.state.content;
            var contentType = this.state.contentType;
            var files = this.state.files;
            
            content.pop();
            this.setState({addSection:false})
            
            if(type === "image"){
                content.push(<div id="contentSize"><img src ={event.target.result}  id="uploadedContent"/></div>)
                contentType.push(type);
                files.push(file);
            }
            if(type === "audio"){
                content.push(<div id="contentSize"><audio id="uploadedContent" controls="Pause, Play"> <source src={event.target.result} /></audio></div>)
                contentType.push(type);
                files.push(file);
            }
            if(type === "video"){
                content.push(<div id="contentSize"><video id="uploadedContent" autoPlay muted> <source src={event.target.result} /></video></div>)
                contentType.push(type);
                files.push(file);
            }
            if(type === "model"){
                content.push(<div id="contentSize"><model-viewer id="uploadedContent" src={event.target.result} camera-controls/></div>)
                contentType.push(type);
                files.push(file);
            }
            this.setState({content, contentType, files});

            if(content.length < 4){
                //console.log("add")
                var contentButtons = <div id="contentButtons"><Button icon="minus" color="black" onClick={this.removeContentSection}/><Button icon="plus" color="black" onClick={this.addContentSection}/></div>
                this.setState({contentButtons})
            }
            else{
                var contentButtons = <div id="contentButtons"><Button icon="minus" color="black" onClick={this.removeContentSection} /><Button icon="plus" color="black" disabled/></div>
                this.setState({contentButtons})
            }

            
        })
        reader.readAsDataURL(file)
    }

    addContentSection = () =>{
        var content = this.state.content;

        if(!this.state.addSection){
            content.push(<label for="fileDialog" id="dropLabel" onDrop={this.drop} onDragOver={this.allowDrop}>
                            <div id="addIcon">
                            <Icon name="plus square outline" size="huge" color="grey"></Icon>
                            </div>
                            <div id="addIcon" >(Image, Video, Audio, or Model)</div>
                        </label>);
            this.setState({content, addSection:true})
        }
    }

    removeContentSection = () =>{
        var content = this.state.content;
        var contentType = this.state.contentType;
        var files = this.state.files;
        if(this.state.addSection === true){
            content.pop()
            this.setState({content, addSection:false})
            return
        }
        if(content.length === 1){
            content.pop();
            contentType.pop();
            files.pop()
            content.push(<label for="fileDialog" id="dropLabel" onDrop={this.drop} onDragOver={this.allowDrop}>
                            <div id="addIcon">
                            <Icon name="plus square outline" size="huge" color="grey"></Icon>
                            </div>
                            <div id="addIcon" >(Image, Video, Audio, or Model)</div>
                         </label>);
            this.setState({content, contentType, files, contentButtons: null, addSection: true})
            return;
        }

        if(content.length === 4){
            var contentButtons = <div id="contentButtons"><Button icon="minus" color="black" onClick={this.removeContentSection}/><Button icon="plus" color="black" onClick={this.addContentSection}/></div>
            this.setState({contentButtons})
        }

        content.pop();
        contentType.pop();
        files.pop();
        this.setState({content, contentType, files})
    }

    allowDrop = (ev) =>{
        //console.log(ev)
        ev.preventDefault();
    }

    drop = async (ev) =>{
        ev.preventDefault();
        if(ev.dataTransfer.files[0] === undefined)
            return
        this.addContent(ev.dataTransfer.files[0])          
    }

    upload = (ev) =>{
        if(ev.target.files[0] === undefined)
            return;
        //console.log(ev.target.files[0]);
        //var file = Buffer.from(ev.target.files[0], "utf-8")
        this.addContent(ev.target.files[0])
    }

    setName = (event) =>{
        var name = event.target.value
        this.setState({name})
    }

    setDescription = (event) =>{
        var description = event.target.value;
        this.setState({description})
    }

    addAttribute = () =>{
        var attributes = this.state.attributes;
        attributes.push({trait_type: "", value: ""})
        this.setState({attributes})
    }

    removeAttribute = () =>{
        var attributes = this.state.attributes;
        attributes.pop()
        this.setState({attributes})
    }

    traitChange = (e) =>{
        var index = e.target.id;
        var attributes = this.state.attributes;
        attributes[index].trait_type = e.target.value;
        this.setState({attributes})
    }

    valueChange = (e) =>{
        var index = e.target.id
        var attributes = this.state.attributes;
        attributes[index].value = e.target.value;
        this.setState({attributes})
    }

    maxMintCountChange = (e) =>{
        var maxMintCount = e.target.value;
        this.setState({maxMintCount})
    }

    mintCostChange = (e) =>{
        var mintCost = e.target.value;
        this.setState({mintCost})
    }

    claimValueChange = (e) =>{
        var claimValue = e.target.value;
        
        this.setState({claimValue})
    }

    toggleBurn = () =>{
        var burnable = this.state.burnable
        this.setState({burnable: !burnable})
    }

    addMetaData(nftJSON){

        var result = {success: false}

        if(this.state.name.length < 5){
            var createError = "*Name must be at least 5 characters."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return result;
        }

        nftJSON["name"] = this.state.name;

        if(this.state.description !== ""){
            nftJSON["description"] = this.state.description;
        }

        // insert attributes into nft
        if(this.state.attributes.length > 0){
            nftJSON["attributes"] = [];
            for(var i = 0; i < this.state.attributes; i++){
                var attribute = {}
                var attributeName = this.state.attributes[i]["trait_type"];
                if(attributeName === ""){
                    continue;
                }
                var attributeValue = this.state.attributes[i]["value"];
                if(attributeValue === ""){
                    continue
                }
                attribute[attributeName] = attributeValue;
                console.log(attribute)
                nftJSON["attributes"].push(attribute);
            }
        }

        return {success: true, nftJSON}

    }

    createContent = async(files, ipfs) =>{

        var result = {success: false}

        this.props.setLoading(true);

        this.setState({stepText: "Creating NFT JSON..."})

        if(!(files.length > 0)){
            var createError = "Add a file to *Main to create an NFT."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return result;
        }

        var contentJSON = {};

        // Place files uri content into contentJSON
        for(var i = 0; i < files.length; i++){
            console.log(`adding file '${files[i].name}' to nft`)
            var result = await ipfs.add(files[i]);
            console.log(`${files[i].name} cid: ${result.cid.toString()}`);
            switch(this.state.contentType[i]){
                case "image": contentJSON["image"] = "ipfs://" + result.cid.toString() + "?filename=" + files[i].name; break;
                case "video": contentJSON["video"] = "ipfs://" + result.cid.toString() + "?filename=" + files[i].name; break;
                case "audio": contentJSON["audio"] = "ipfs://" + result.cid.toString() + "?filename=" + files[i].name; break;
                case "model": contentJSON["model"] = "ipfs://" + result.cid.toString() + "?filename=" + files[i].name; break;
                default:
                    break;
            }
        }
        
        // Insert subURIs in correct placement for hashing.
        var subURIsT = [contentJSON["image"], contentJSON["audio"],  contentJSON["video"], contentJSON["model"]]

        var subURIs = [];

        for(var i = 0; i < subURIsT.length; i++ ){
            if(subURIsT[i] !== undefined){
                subURIs.push(subURIsT[i])
                continue;
            }
            subURIsT[i] = "";
        }
        console.log(`SubURIs: ${subURIs}`)

        return {success: true, contentJSON, subURIs, subURIsT};
    }

    evaluateContractVars = () =>{

        var result = {success: false}
        // Condition to evaluate correct contract variables.
        
        if(!Number.isInteger(Number(this.state.maxMintCount)) || !Number.isInteger(Number(this.state.mintCost))){
            var createError = "An invalid Max Mint Count or Mint Cost paramaters were given. Enter valid network token amounts to create your NFT."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return result;
        }

        if(this.state.claimValue === undefined){
            console.log("claim value undefined.")
            result.claimValue = this.state.mintCost;
        }
        else if(isNaN(this.state.claimValue)){
            return result;
        }
        else if(Number(this.state.claimValue) > Number(this.state.mintCost)){
            return result;
        }
        else{
            result.claimValue = this.state.claimValue;
        }

        result.success = true;
        return result;
    }

    createNFT = async () =>{
        //console.log(this.state.attributes)

        console.log("CreateNFT")

        //TODO: parse process to functions.

        var files = this.state.files;

        var ipfs = global.ipfs;

        var web3 = this.props.web3;

        if(this.props.networkError !== ""){
            var createError = this.props.networkError
            this.setState({createError, stepText: ""});
            return;
        }

        // Deploy NFT Contract
        if(this.props.account === undefined){
            var createError = "Connect Wallet to Create your NFT."
            this.setState({createError, stepText: ""});
            return;
        }

        var nftObj = this.addMetaData();

        if(!nftObj.success){
            return;
        }

        var nftJSON = nftObj.nftJSON;

        var contentObj = await this.createContent(files, ipfs);

        if(!contentObj.success){
            return;
        }

        var contentJSON = contentObj.contentJSON;

        var subURIs = contentObj.subURIs;

        var subURIsT = contentObj.subURIsT;

        if(contentJSON["image"] !== undefined){
            nftJSON["image"] = contentJSON["image"];
        }

        if(contentJSON["video"] !== undefined ){
            nftJSON["animation_url"] = contentJSON["video"]
        }
        else if (contentJSON["model"] !== undefined){
            nftJSON["animation_url"] = contentJSON["model"]
        }
        else if(contentJSON["audio"] !== undefined){
            nftJSON["animation_url"] = contentJSON["audio"]
        }

        //console.log(contentJSON);

        var evalContract = this.evaluateContractVars()

        console.log(evalContract)

        if(evalContract.success === false){
            return;
        }

        var claimValue = evalContract.claimValue;

        console.log(claimValue)

        // Encapsulate async calls with try/catch
        try{
           
            this.setState({stepText: "Deploying NFT Contract..."});

            console.log(`NFT Vars: { name: ${this.state.name}, mintCount: ${this.state.maxMintCount}, mintCost: ${web3.utils.toWei(this.state.mintCost.toString(), "ether")}, claimValue: ${ web3.utils.toWei(claimValue.toString(),"ether")}, burnable: ${this.state.burnable} from: ${this.props.account}}}`);

            var ratioNFT = await this.props.RatioSingleNFT.new(this.state.name, "RNFT", this.state.maxMintCount, web3.utils.toWei(this.state.mintCost.toString(), "ether"), web3.utils.toWei(claimValue.toString(), "ether"), this.state.burnable, {from: this.props.account});
            contentJSON["contract"] = ratioNFT.address;
            contentJSON["distributor"] = this.props.account;

            this.setState({stepText: "Signing NFT..."});

            var contentHash = web3.utils.soliditySha3(JSON.stringify(contentJSON))
            console.log(web3.eth.personal)
            var signedContent = await web3.eth.sign(contentHash, this.props.account) //this.wallet.unlocked ? wallet.sign(contentHash) : 
            //console.log(signedContent)
            nftJSON["content"] = contentJSON;
            nftJSON["signature"] = signedContent;

            console.log(JSON.stringify(nftJSON))

            //Add 

            var nft = await ipfs.add(JSON.stringify(nftJSON));

            var baseURI = "ipfs://" + nft.cid.toString()

            console.log(`   BaseURI: ${baseURI}`);

            var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;

            console.log("NFT Protocol Address:" + protocolAddress)

            this.setState({stepText: "Setting NFT Contract BaseURI..."});

            /*
            if(!this.state.host){
                await ratioNFT.setBaseURI(baseURI, false, protocolAddress, {from: this.props.account});
                var displayFinalInfo = <Container id="finalContent" textAlign="left" style={{width: "750px"}}><p>Your NFT has been deployed to: {ratioNFT.address}</p><p>You can find the NFT content below or at: <a href={baseURI}>{baseURI}</a></p></Container>
                var displayFinalContent = <TextArea id="finalContent" style={{width: "750px", height: "25vh"}}>{JSON.stringify(nftJSON, null, 4)}</TextArea>
                this.setState({stepText: "NFT Created!", displayFinalInfo, displayFinalContent})
                this.props.setLoading(false);
                return;
            }*/

            var block = (await ratioNFT.setBaseURI(baseURI, true, protocolAddress, {from: this.props.account, value: web3.utils.toWei(".01", "ether")})).receipt.blockNumber;

            console.log(`NFT Verificaiton Request Block Number: ${block}`);

            console.log(` ${nftJSON.content.contract}`);

            this.setState({stepText: "Sending Ratio Labs NFT For Verification..."})

            var nftProtocol = await this.props.NFTProtocol.at(protocolAddress);

            var latestBlock = await nftProtocol.latestBlock();

            console.log(`latestBlock: ${latestBlock}`);
            
            var state = await gatewayApi.state(nftJSON.content.contract);

            console.log(state)

            if(state.status !== "success"){
                if(state.reason === "Invalid contract address format.")
                {
                    this.setState({createError: "Unexpected NFT Creation Error."});
                    this.props.setLoading(false)
                    return;
                }
                while(state.status !== "success"){
                    await new Promise(r => setTimeout(r, 2000));
                    state = await gatewayApi.state(nftJSON.content.contract)
                }
            }

            if(state.state !== "new"){
                this.setState({createError: "NFT is already verified or hosted."})
                this.props.setLoading(false)
                return;
            }

            // Send data to Ratio

            const form = new FormData();

            const nftString = JSON.stringify(nftJSON);

            form.append(ratioNFT.address, nftString);

            for(var i = 0; i < subURIs.length; i++){
                form.append(subURIs[i], files[i]);
            }
            var verify = await gatewayApi.verify(form);

            if(verify.status !== "success"){
                this.setState({createError: verify.reason})
                this.props.setLoading(false);
                return;
            }

            console.log(`verify: ${verify}`);

            state = await gatewayApi.state(nftJSON.content.contract);
            console.log(`   State: ${JSON.stringify(state)}`);

            this.setState({stepText: "Waiting for Ratio Labs Verification..."})

            var leaf;
            switch(subURIs.length){
                case 1:
                    leaf = web3.utils.soliditySha3(ratioNFT.address, this.props.account, baseURI, subURIs[0], block);
                    break; 
                case 2:
                    leaf = web3.utils.soliditySha3(ratioNFT.address, this.props.account, baseURI, subURIs[0], subURIs[1], block)
                    break; 
                case 3:
                    leaf = web3.utils.soliditySha3(ratioNFT.address, this.props.account, baseURI, subURIs[0], subURIs[1], subURIs[2], block)
                    break; 
                case 4:
                    leaf = web3.utils.soliditySha3(ratioNFT.address, this.props.account, baseURI, subURIs[0], subURIs[1], subURIs[2], subURIs[3], block)
                    break; 
            }

            var currentBlock = await nftProtocol.latestBlock();

            while(currentBlock._block === latestBlock._block){
                console.log("Waiting for new block...")
                await new Promise(p => setTimeout(p, 2000));
                currentBlock = await nftProtocol.latestBlock();
            }

            while(!currentBlock._leaves.includes(leaf)){
                console.log("Waiting for block to include leaf...")
                await new Promise(p => setTimeout(p, 2000));
                currentBlock = await nftProtocol.latestBlock();
            }

            var tree = new MerkleTree(currentBlock._leaves, keccak256, {sort: true})

            var proof = tree.getHexProof(leaf)

            var nftStruct = {_contract: ratioNFT.address, _distributor: this.props.account, _baseURI: baseURI, _subURIs: subURIs, _block: block}

            this.setState({stepText: "Confirming Ratio Labs Verification..."})

            var receipt = await nftProtocol.verifyNFT(proof, currentBlock._root, leaf, nftStruct, {from: this.props.account});

            console.log(`verifyNFT receipt: ${receipt.logs[0].args[0]}`);

            this.setState({stepText: "Setting NFT Contract SubURIs..."})

            console.log(`subRUIs: ${subURIsT}`);

            await ratioNFT.setSubURIs(subURIsT[0], subURIsT[1], subURIsT[2], subURIsT[3], {from: this.props.account})

            this.setState({stepText: "NFT Created!"})

            var displayFinalInfo = <Container id="finalContent" textAlign="left" style={{width: "750px"}}><p>Your NFT has been deployed to: {ratioNFT.address}</p><p>You can find the NFT content below or at: <a href={baseURI}>{baseURI}</a></p></Container>

            var displayFinalContent = <TextArea id="finalContent" style={{width: "750px", height: "25vh"}}>{JSON.stringify(nftJSON, null, 4)}</TextArea>

            this.setState({displayFinalInfo, displayFinalContent})

        }
        catch(err){
            console.log(err)
        }

        //var version =  await global.ipfs.version()

        this.props.setLoading(false)
    }

    render(){

        var createButton = this.props.loading ?  <Button id="createButton" color="black" loading size="huge">Loading</Button> : <Button id="createButton" color="black" onClick={this.createNFT} size="huge">Create NFT</Button> 

        return(
            <div id="mainComponent">
                <Segment basic inverted id="banner">
                        <Container textAlign="left">
                            <div id="bannerText">Create</div>
                            <p id="bannerSub">Non-Fungible Tokens.</p>
                        </Container>
                </Segment>
                <div id="networkError">{this.props.networkError}</div>
                <div id="createForm">
                    <Container textAlign="left">
                        <div id="prompt">Use the form below to create NFT's utilizing the Ratio NFT Protocol. (see About)</div>
                        <div id="required">* Indicates Required Fields</div>
                        {/*<Button onClick={this.testVerify}>verify</Button>*/}
                        <Form id="nftForm" onSubmit={() => this.createNFT}>
                            <div style={{"marginTop": "3vh", "font-size": "x-large"}}>Content: </div>
                            <div id="nftContent">
                                <div style={{"marginTop": "3vh", "font-size": "large"}}>&emsp; *Main:</div>
                                {this.state.content.map(c =>(
                                    <div className="drop">
                                        {c}
                                    </div>
                                ))}
                                {this.state.contentButtons}
                                <input id="fileDialog" type="file" onChange={this.upload}/>
                                <div id="supportedFiles">&emsp; Supported file types: JPG, PNG, GIF, SVG, MP3, WAV, OGG, MP4, WEBM, GLB, GLTF. Max size: 100 MB </div>
                                <div id="contentError">{this.state.contentError}</div>

                                <div style={{"marginTop": "3vh", "font-size": "large"}}>&emsp; *Name:</div>
                                <input id="nameInput"  onChange={this.setName}/>

                                <div style={{"marginTop": "3vh", "font-size": "large"}}>&emsp; &nbsp; Description:</div>
                                <textarea id="descriptionArea" onChange={this.setDescription}/>

                                <div style={{"marginTop": "3vh", "font-size": "large"}}>&emsp; &nbsp; Attributes:</div>
                                <div id="attributes">
                                    {this.state.attributes.map((p, i) =>(
                                        <div className="prop">
                                            <input label="Trait type:" className="propInput" id={i}  placeholder="trait_type" size="small" onChange={this.traitChange}/>
                                            <input style={{"marginLeft": "1vh"}} label="Value:" className="propInput" id={i} placeholder="value" size="small" onChange={this.valueChange}/>
                                        </div>
                                    ))}
                                        
                                    <div id="propButtons"><Button icon="minus" color="black" onClick={this.removeAttribute} /><Button icon="plus" color="black" onClick={this.addAttribute}/></div>
                                </div>
                                <Divider />
                                <div style={{"marginTop": "3vh", "font-size": "large"}}>&emsp; &nbsp; *Contract:</div>
                                <div className="contractVars">
                                    <div className="contractInput">
                                        <input className="cInput" size="small" placeholder="*Max Mint Count"  onChange={this.maxMintCountChange}/>
                                    </div>
                                    <br/>
                                    <div className="contractInput">
                                        <input className="cInput" size="small" placeholder="*Mint Cost"  onChange={this.mintCostChange}/>
                                    </div>
                                    <br/>
                                    <div className="contractInput">
                                        <input className="cInput" size="small"  placeholder="Claim Value"  onChange={this.claimValueChange}/>
                                        <Popup content="This field sets how much the distributor (creator address) will receive from the Mint Cost. Default is Mint Cost." trigger={<Icon name="question circle"/>  } />
                                    </div>
                                    <br/>
                                    <div className="contractInput">
                                        <div id="burnable"><Radio toggle onChange={this.toggleBurn} /> &nbsp; &nbsp; Enable Burning</div>
                                        <Popup content={<div><p>When Burnable, Minted NFTs may be removed from circulation allowing owners to recieve part or all of the Mint Cost</p><p>(Mint Cost - Claim Value)</p></div>} trigger={<Icon name="question circle"/>  } />
                                    </div>
                                    
                                </div>
                            </div>
                            <Divider id="subDivide"></Divider>
                            <div id="submitSection">
                                <div id="createLabel">Create</div>
                                <div id="createAbout">&emsp;A mutistep process is used to create NFT's with strong verification properties. Clicking the Create NFT button will begin this proccess.</div>
                                <div id="step">{this.state.stepText}</div>
                                <div id="submission">
                                   {createButton}
                                </div>
                                <div id="submitError">{this.state.createError}</div>
                                {this.state.displayFinalInfo}
                                <br/>
                                {this.state.displayFinalContent}
                            </div>
                        </Form>
                    </Container>
                </div>
            </div>
        )  
    }
}

export default Create;
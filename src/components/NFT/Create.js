import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Container, Segment, Form, Icon, Button, Dropdown, Divider, Menu, Input, Radio, Popup} from 'semantic-ui-react';

import  "@google/model-viewer";

import deployedContracts from "../../data/Deployed_Contracts.json"

import networkData from "../../data/Network_Data.json"

import * as contract from "@truffle/contract";

import * as fs from 'fs';

import RatioNFT from '../../contracts/RatioNFT.json';

import testnft from "./CryptoMonkeyRatioNFT.json";

import * as nftOracleAPI from "./nftOracleAPI.js";

var oracleApi;

var prod = false;

var host;

class Create extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {content: [<label for="fileDialog" id="dropLabel" onDrop={this.drop} onDragOver={this.allowDrop}>
                                    <div id="addIcon">
                                    <Icon name="plus square outline" size="huge" color="grey"></Icon>
                                    </div>
                                    <div id="addIcon" >(Image, Video, Audio, or Model)</div>
                                </label>], contentType: [], files: [],
                        contentButtons: null, addSection: true, contentError: null,
                        name: "", description: "",
                        properties:[],
                        options:[{key: "number", text:"Number", value:"number"}, {key:"string", text:"Word", value:"string"}, ],
                        createLoading: false,
                        maxMintCount: null, mintCost: null,
                        createError: "",
                        finalContent: null,
                        host: true, nftDeploymentCost: "",
                      }
        host = prod ? "https://ratiomaster.site" : "http://localhost:3001";

        //console.log({nftOracleAPI})

        oracleApi = new nftOracleAPI(host);
    
        
        //this.addContent = this.addContent.bind(this);
    }

    componentDidMount = async () =>{
        //ipfs = await IPFS.create({start: false, offline: true});
        //var version = await global.ipfs.version(); 
        //console.log("IPFS Mount, Version: " + version.version)
        this.RatioNFT = contract(RatioNFT)

        if(this.props.web3 === undefined){
            return;   
        }
        //console.log(this.props.web3.currentProvider);
        
        this.RatioNFT.setProvider(this.props.web3.currentProvider);
    }

    componentDidUpdate = async (prevProps) =>{

        //console.log("update")

        if(this.props.web3 === undefined || prevProps.web3 === undefined)
            return;

        if(prevProps.web3.currentProvider !== this.props.web3.currentProvider){
            this.RatioNFT.setProvider(this.props.web3.currentProvider);
        }

    }

    addContent = (file) =>{
        
        const reader = new FileReader();

        //console.log(file);

        var type = null;

        var fileName = file.name.split(".");

        switch(fileName[fileName.length-1]){
            case "jpg":
                type = "image";
                break;
            case "png" :
                type = "image";
                break;
            case "gif" :
                type = "image";
                break;
            case "svg" :
                type = "image";
                break;
            case "mp4" :
                type = "video";
                break;
            case "webm" :
                type = "video";
                break;
            case "ogg":
                type = "audio";
                break;
            case "mp3":
                type = "audio";
                break;
            case "wav":
                type = "audio";
                break;
            case "glb" : 
                type = "model";
                break
            case "gltf": 
                type = "model"
                break;
            default:
                break;
        }

        //console.log(type)
        
        if(type === null){
            console.log("unsupported file type")
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
            if(type === "video"){
                content.push(<div id="contentSize"><video id="uploadedContent" autoPlay muted> <source src={event.target.result} /></video></div>)
                contentType.push(type);
                files.push(file);
            }
            if(type === "audio"){
                content.push(<div id="contentSize"><audio id="uploadedContent" controls="Pause, Play"> <source src={event.target.result} /></audio></div>)
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
                var contentButtons = <div id="contentButtons"><Button icon="minus" onClick={this.removeContentSection}/><Button icon="plus" onClick={this.addContentSection}/></div>
                this.setState({contentButtons})
            }
            else{
                var contentButtons = <div id="contentButtons"><Button icon="minus" onClick={this.removeContentSection} /><Button icon="plus" disabled/></div>
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
            var contentButtons = <div id="contentButtons"><Button icon="minus" onClick={this.removeContentSection}/><Button icon="plus" onClick={this.addContentSection}/></div>
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
            return

        console.log(ev.target.files[0]);

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

    addProperty = () =>{
        var properties = this.state.properties;
        properties.push({name: "", value: ""})
        
        this.setState({properties})
    }

    removeProperty = () =>{
        var properties = this.state.properties;
        properties.pop()
        this.setState({properties})
    }

    nameChange = (e, data) =>{

        var index = data.id.replace("propInput", "")

        var properties = this.state.properties;

        properties[index].name = data.value;

    }

    valueChange = (e, data) =>{
        var index = data.id.replace("propInput", "")

        var properties = this.state.properties;

        properties[index].value = data.value;
    }

    createNFT = async () =>{
        //console.log(this.state.properties)

        console.log("CreateNFT")

        var files = this.state.files;

        var ipfs = global.ipfs;

        var web3 = this.props.web3;

        this.props.setLoading(true);

        this.setState({stepText: "Creating NFT JSON..."})

        if(!(files.length > 0)){
            var createError = "Add a file to *Main to create an NFT."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return;
        }

        if(this.state.name.length < 5){
            var createError = "*Name must be at least 5 characters."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return
        }

        var contentJSON = {};

        contentJSON["name"] = this.state.name;

        if(this.state.description !== ""){
            contentJSON["description"] = this.state.description;
        }

        var subURIs = [];
        
        for(var i = 0; i < files.length; i++){
            console.log(files[i])
            var result = await ipfs.add(files[i]);
            subURIs.push("ipfs://" + result.cid.toString());
            console.log(result.cid.toString())
            switch(this.state.contentType[i]){
                case "image": contentJSON["image"] = "ipfs://" + result.cid.toString(); break;
                case "video": contentJSON["video"] = "ipfs://" + result.cid.toString(); break;
                case "audio": contentJSON["audio"] = "ipfs://" + result.cid.toString(); break;
                case "model": contentJSON["model"] = "ipfs://" + result.cid.toString(); break;
                default:
                    break;
            }
        }

        if(this.state.properties.length > 0){
            contentJSON["properties"] = [];
            for(var i = 0; i < this.state.properties; i++){
                var property = {}
                var propertyName = this.state.properties[i]["name"];
                if(propertyName === ""){
                    continue;
                }
                var propertyValue = this.state.properties[i]["value"];
                if(propertyValue === ""){
                    continue
                }
                property[propertyName] = propertyValue;
                console.log(property)
                contentJSON["properties"].push(property);
            }
        }

        //console.log(contentJSON);

        if(!Number.isInteger(Number(this.state.maxMintCount)) || !Number.isInteger(Number(this.state.mintCost)) ){
            var createError = "An invalid mint count or cost was given. Enter a full number to create your NFT."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return;
        }

        // Deploy NFT Contract
        if(this.props.account === undefined){
            var createError = "Connect Wallet to Create your NFT."
            this.setState({createError, stepText: ""});
            this.props.setLoading(false)
            return;
        }

        try{
            if(this.RatioNFT.currentProvider === undefined ){
                this.RatioNFT.setProvider(this.props.web3.currentProvider);
            }

            this.setState({stepText: "Deploying NFT Contract..."});

            var ratioNFT = await this.RatioNFT.new(this.state.name, "RNFT", this.state.maxMintCount, this.state.mintCost, {from: this.props.account});
            contentJSON["contract"] = ratioNFT.address;
            contentJSON["distributor"] = this.props.account;

            this.setState({stepText: "Signing NFT..."});

            var contentHash = web3.utils.sha3(JSON.stringify(contentJSON))
            var signedContent = await web3.eth.personal.sign(contentHash, this.props.account)
            //console.log(signedContent)
            var nftJSON = {}
            nftJSON["content"] = contentJSON;
            nftJSON["signature"] = signedContent;

            console.log(JSON.stringify(nftJSON))

            var nft = await ipfs.add(JSON.stringify(nftJSON));

            var baseURI = "ipfs://" + nft.cid.toString()

            console.log(`   BaseURI: ${baseURI}`);

            var protocolAddress = deployedContracts[networkData[this.props.network].chainName].ProtocolNFT.address;

            console.log("ProtocolNFT Address:" + protocolAddress)

            this.setState({stepText: "Setting NFT Contract URI..."});

            if(!this.state.host){
                await ratioNFT.setBaseURI(baseURI, false, protocolAddress, {from: this.props.account});
                this.setState({stepText: "NFT Created!"})
                this.props.setLoading(false);
                return;
            }

            await ratioNFT.setBaseURI(baseURI, true, protocolAddress, {from: this.props.account, value: web3.utils.toWei(".01", "ether")});

            console.log(` ${nftJSON.content.contract}`);

            this.setState({stepText: "Waiting for Ratio Labs Verification..."})

            var state = await oracleApi.state(nftJSON.content.contract)

            if(state.status !== "success"){
                if(state.reason === "Invalid contract address format.")
                {
                    this.setState({createError: "Unexpected NFT Creation Error."});
                    this.props.setLoading(false)
                    return;
                }
                while(state.status !== "success"){
                    await new Promise(r => setTimeout(r, 2000));
                    state = await oracleApi.state(nftJSON.content.contract)
                }
            }

            if(state.state !== "new"){
                this.setState({createError: "NFT is already verified or hosted."})
                this.props.setLoading(false)
                return;
            }

            var ver = await oracleApi.verify(nftJSON);

            console.log(ver.status)

            if(ver.status !== "success"){
                this.setState({createError: ver.reason})
                this.props.setLoading(false);
                return;
            }

            state = await oracleApi.state(nftJSON.content.contract);
            console.log(`   State: ${JSON.stringify(state)}`);

            // Send data to Ratio
        }
        catch(err){
            console.log(err)
        }

        //var version =  await global.ipfs.version()

        this.props.setLoading(false)
        
    }

    host = () =>{
        var host = this.state.host;

        this.setState({host: !host});

        console.log()

        this.calculateFee();
    }

    calculateFee = () =>{

    }

    maxMintCountChange = (e, data) =>{
        var maxMintCount = data.value;
        this.setState({maxMintCount})
    }

    mintCostChange = (e, data) =>{
        var mintCost = data.value;
        this.setState({mintCost})
    }

    testHost = async () =>{


        var nft = {"content":{"name":"Ratio Card","image":"ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ","contract":"0xc6bF5824D849f68c4D39283cEDf23F38b9567AB8","distributor":"0xCA76A94C54b461d7230a59f4f78C1Dd3a0eACd63"},"signature":"0x2d22f5cd608ac78b53be2b8fbc5653777626d1dc8fea4feb0256f696cc311b60745b5a73a6fc1ebe820958eded1bd24f8dcb98e05b8c2ab0478bc33e4f9716fc1b"}

        const nftString = JSON.stringify(nft);

        var baseURI = "ipfs://QmQZrbujeGjZfky7aUKqX81pC6rTqAmaHv27VZcLf2Ye4i";

        const blob = new Blob([nftString], {type: "application/json"})

        const file = new File([blob], baseURI.replace("ipfs://", ""))
        
        var subURI = "ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ";
        const data = new FormData();
        
        if(this.state.files.length === 0){
            console.log("no files.")
            return
        }

        data.append(baseURI, file)

        for(var f of this.state.files){
            data.append(subURI, f);
        }
        
        //console.log(data.getAll('file'))

        oracleApi.host(data);
    }

    testVerify = async() =>{
        var nft = {"content":{"name":"Ratio Card","image":"ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ","contract":"0xa64A895fDCFA0C94E1240BDe002b50B248983dE5","distributor":"0xCA76A94C54b461d7230a59f4f78C1Dd3a0eACd63"},"signature":"0xa355642b6539beb85f4d6ed7952f477d42ef519eae76a48fde14119cf3c3536558f765f41709b3cd905c8cf885bd1eee2f5c982c104dfd17167d5d2ea5130b971c"}
        //await oracleApi.verify(nft)

        await oracleApi.state(nft.content.contract);
    }

    render(){

        var createButton = this.props.loading ?  <Button id="createButton" color="black" loading size="huge">Loading</Button> : <Button id="createButton" color="black" onClick={this.createNFT} size="huge">Create NFT</Button> 

        return(
            <div id="createComponent">
                <Segment basic inverted id="createBanner" style={{"margin-top": "auto", height: "25vh"}}>
                        <Container textAlign="left">
                            <div id="createText">Create</div>
                        </Container>
                </Segment>
                <div id="createForm" style={{"padding-top": "6vh", color:"black", }}>
                    <Container textAlign="left">
                        <div id="prompt">Use the form bellow to create NFT's utilizing the Ratio NFT Protocol. (see About)</div>
                        <div id="required">* Indicates Required Fields</div>
                        <Button onClick={this.testHost}>Test</Button>
                        <Form id="nftForm" onSubmit={() => this.createNFT}>
                            <div style={{"margin-top": "3vh", "font-size": "x-large"}}>Content: </div>
                            <div id="nftContent">
                                <div style={{"margin-top": "3vh", "font-size": "large"}}>&emsp; *Main:</div>
                                {this.state.content.map(c =>(
                                    <div className="drop">
                                        {c}
                                    </div>
                                ))}
                                {this.state.contentButtons}
                                <input id="fileDialog" type="file" onChange={this.upload}/>
                                <div id="supportedFiles">&emsp; Supported file types: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF. Max size: 1000 MB </div>
                                <div id="contentError">{this.state.contentError}</div>

                                <div style={{"margin-top": "3vh", "font-size": "large"}}>&emsp; *Name:</div>
                                <input  style={{width: "50%", alignSelf: "center"}} onChange={this.setName}/>

                                <div style={{"margin-top": "3vh", "font-size": "large"}}>&emsp; &nbsp; Description:</div>
                                <textarea style={{width: "50%", height:"100px", alignSelf: "center"}}  onChange={this.setDescription}/>

                                <div style={{"margin-top": "3vh", "font-size": "large"}}>&emsp; &nbsp; Properties:</div>
                                <div id="properties">
                                    {this.state.properties.map((p, i) =>(
                                        <div className="prop">
                                            {/*<Menu compact style={{width:"25%"}}>
                                                    <Dropdown simple item placeholder="Type" id={"dropdown" + i} options={this.state.options} onChange={this.propertyDrop}/>
                                                </Menu>*/}
                                            <div>Name:</div>
                                            <Form.Input id={"propInput" + i} style={{"marginLeft": "1vh"}} placeholder="Name" size="small" onChange={this.nameChange}/>
                                            <div id="valuePropLabel">Value:</div>
                                            <Form.Input id={"propInput" + i} style={{"marginLeft": "1vh"}} placeholder="Value" size="small" onChange={this.valueChange}/>
                                        </div>
                                    ))}
                                        
                                    <div id="propButtons"><Button icon="minus" onClick={this.removeProperty}/><Button icon="plus" onClick={this.addProperty}/></div>
                                </div>
                                <Divider />
                                <div style={{"margin-top": "3vh", "font-size": "large"}}>&emsp; &nbsp; *Contract:</div>
                                <div className="contractVars">
                                    <div id="contractInput">
                                        <div className="mintLabel">*Max Mint Count:</div>
                                        <Form.Input size ="small"  placeholder="Mint Count"  onChange={this.maxMintCountChange}/>
                                    </div>
                                    <br/>
                                    <div id="contractInput">
                                        <div className="mintLabel">*MintCost:</div>
                                        <Form.Input size="small" placeholder="Mint Cost e.g., (1 Matic)"  onChange={this.mintCostChange}/>
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
                                    <div id="verify">
                                        <Radio toggle defaultChecked onChange={this.host}/> &emsp; Host With Ratio Labs <Popup content="Ensure your NFT is verified and distributed on IPFS via Ratio Labs." trigger={<Icon name="question circle"/>  } />
                                    </div>
                                </div>
                                <div id="submitError">{this.state.createError}</div>
                                
                                <div id="nftMain"></div>
                                <div id="nftContract"></div>
                                <div id="nftVerified"></div>
                                <div id="nftHosted"></div>
                            </div>
                        </Form>
                    </Container>
                </div>
                
            </div>
        )  
    }
}

export default Create;
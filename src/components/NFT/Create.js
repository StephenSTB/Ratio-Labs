import React, { Component } from "react";

import 'semantic-ui-css/semantic.min.css';

import {Container, Segment, Form, Icon, Button, Divider, Radio, Popup, TextArea, Flag} from 'semantic-ui-react';

import  "@google/model-viewer";

import {create} from "ipfs-core"

import deployedContracts from "../../data/Deployed_Contracts.json"

import networkData from "../../data/Network_Data.json"

import * as nftGatewayAPI from "./nftGatewayAPI.js";

import { MerkleTree } from 'merkletreejs';

import * as keccak256 from 'keccak256';

import * as mime from 'mime-types';

import all from "it-all";

import * as uint8arrays from "uint8arrays"

var gatewayApi;

var prod = false;

var host;

var uri_ext = ["jpg", "jpeg", "png", "gif", "svg", "mp3", "mpga", "wav", "ogg", "oga", "mp4", "webm", "glb", "gltf"];

var max_size = 100_000_000;

var zeroAddress = "0x0000000000000000000000000000000000000000";

class Create extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {content: [<label for="fileDialog" id="dropLabel" onDrop={this.drop} onDragOver={this.allowDrop}>
                                    <div id="addIcon">
                                        <Icon name="plus square outline" size="huge"></Icon>
                                    </div>
                                    <div id="addIcon" >(Image, Video, Audio, or Model)</div>
                                </label>], contentType: [], files: [], fileCIDs: [],
                        contentButtons: null, addSection: true, contentError: null,
                        animation_url: null, animation_type: null,
                        name: "", description: "",
                        properties: [], attributes:[],
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
       
        try{
            var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;

            console.log("NFT Protocol Address:" + protocolAddress)

            var nftProtocol = await this.props.NFTProtocol.at(protocolAddress)

            console.log("NFT Protocol Address:" + nftProtocol.address)

            this.setState({nftProtocol})
            
        }
        catch(e)
        {
            this.setState({nftProtocol: undefined})
            console.log(e)
        }

    }

    componentDidUpdate = async (prevProps) =>{
        //console.log("update")
        if(this.props.web3 === undefined || this.props.account === undefined || this.props.networkError !== "" || prevProps === undefined)
        {
            return;
        }

        if(prevProps !== this.props){
            try{
                var protocolAddress = deployedContracts[networkData[this.props.network].chainName].NFTProtocol.address;
    
                console.log("NFT Protocol Address:" + protocolAddress)
    
                var nftProtocol = await this.props.NFTProtocol.at(protocolAddress)
    
                console.log("NFT Protocol Address:" + nftProtocol.address)
    
                this.setState({nftProtocol})
                
            }
            catch(e)
            {
                this.setState({nftProtocol: undefined})
                console.log(e)
            }
        }
        
    }

    addContent = async (file) =>{

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
            this.setState({contentError: "A " + type + " has already been added. Only one content object per type is allowed."})
            return;
        }

        var nftProtocol = this.state.nftProtocol;

        if(nftProtocol === undefined || global.ipfs === undefined){
            this.setState({contentError: "NFT Protocol address not defined."})
            return
        }

        var blob = new Blob([file])

        console.log(blob);

        var uri = "ipfs://" + (await global.ipfs.add(blob)).cid.toString() + "?filename=" + file.name;

        console.log(`file uri: ${uri}`);

        var exists = await nftProtocol.contract.methods.subURIContract(uri).call();

        if(exists !== zeroAddress){
            console.log("uri exists:")
            console.log(exists)
            this.setState({contentError: "Content already exists in Ratio NFT Protocol."})
            return;
        }
                 
        reader.addEventListener('load', (event) => {
            var content = this.state.content;
            var contentType = this.state.contentType;
            var files = this.state.files;
            
            content.pop();
            this.setState({addSection:false})
            
            if(type === "image"){
                content.push(<div id="contentSize"><img alt="" src ={event.target.result}  id="uploadedContent"/></div>)
            }
            if(type === "audio"){
                content.push(<div id="contentSize"><audio id="uploadedContent" controls="Pause, Play"> <source src={event.target.result} /></audio></div>)
            }
            if(type === "video"){
                content.push(<div id="contentSize"><video id="uploadedContent" autoPlay muted> <source src={event.target.result} /></video></div>)
            }
            if(type === "model"){
                content.push(<div id="contentSize"><model-viewer id="uploadedContent" src={event.target.result} camera-controls/></div>)
            }

            contentType.push(type);
            files.push(file);

            this.setState({content, contentType, files});

            if(content.length < 4){
                this.setState({contentButtons: <div id="contentButtons"><Button icon="minus" color="black" onClick={this.removeContentSection}/><Button icon="plus" color="black" onClick={this.addContentSection}/></div>})
            }
            else{
                this.setState({contentButtons: <div id="contentButtons"><Button icon="minus" color="black" onClick={this.removeContentSection} /><Button icon="plus" color="black" disabled/></div>})
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

    addMetaData(){
        var result = {success: false}

        var nftJSON = {}

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
            var res = await ipfs.add(files[i]);
            console.log(`${files[i].name} cid: ${res.cid.toString()}`);
            switch(this.state.contentType[i]){
                case "image": contentJSON["image"] = "ipfs://" + res.cid.toString() + "?filename=" + files[i].name; break;
                case "video": contentJSON["video"] = "ipfs://" + res.cid.toString() + "?filename=" + files[i].name; break;
                case "audio": contentJSON["audio"] = "ipfs://" + res.cid.toString() + "?filename=" + files[i].name; break;
                case "model": contentJSON["model"] = "ipfs://" + res.cid.toString() + "?filename=" + files[i].name; break;
                default:
                    break;
            }
        }
        
        // Insert subURIs in correct placement for hashing.
        var subURIsT = [contentJSON["image"], contentJSON["audio"],  contentJSON["video"], contentJSON["model"]]

        var subURIs = [];

        for(i = 0; i < subURIsT.length; i++ ){
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

    ipfsHost = async (ipfs, nftJSON, files) =>{

        console.time('IPFS Started')
        await ipfs.start();
        console.timeEnd('IPFS Started')

        console.log("adding files");

        var addNFT = await ipfs.add(JSON.stringify(nftJSON))

        console.log(addNFT.cid.toString());

        await ipfs.pin.add(addNFT.cid)

        for(var f of files){
            console.log(f.name)
            var blob = new Blob([f]);

            var addBlob = await ipfs.add(blob);

            console.log("file cid: " + addBlob.cid.toString());

            await ipfs.pin.add(addBlob.cid)
        }
    }

    createNFT = async () =>{
        //console.log(this.state.attributes)

        console.log("CreateNFT")

        //TODO: parse process to functions.

        var files = this.state.files;

        var ipfs = global.ipfs;

        var web3 = this.props.web3;

        if(this.props.networkError !== ""){
            this.setState({createError: this.props.networkError, stepText: ""});
            return;
        }

        // Deploy NFT Contract
        if(this.props.account === undefined){
            this.setState({createError: "Connect Wallet to Create your NFT.", stepText: ""});
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
            var signedContent = await web3.eth.personal.sign(contentHash, this.props.account) 
            //console.log(signedContent)
            nftJSON["content"] = contentJSON;
            nftJSON["signature"] = signedContent;

            console.log(JSON.stringify(nftJSON))

            var nft = await ipfs.add(JSON.stringify(nftJSON));

            var baseURI = "ipfs://" + nft.cid.toString()

            console.log(`   BaseURI: ${baseURI}`);

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

            console.log(`${this.state.nftProtocol.address}`);

            var block = (await ratioNFT.setBaseURI(baseURI, true, this.state.nftProtocol.address, {from: this.props.account, value: web3.utils.toWei(".01", "ether")})).receipt.blockNumber;

            console.log(`NFT Verificaiton Request Block Number: ${block}`);

            console.log(` ${nftJSON.content.contract}`);

            this.setState({stepText: `Hosting NFT For Ratio Labs Verification...`})

            var nftProtocol = this.state.nftProtocol;

            var latestBlock = await nftProtocol.latestBlock();

            console.log(`latestBlock: ${latestBlock}`);

            // TOOD: IPFS hosting.

            await this.ipfsHost(ipfs, nftJSON, files)

            /*
            
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
            console.log(`   State: ${JSON.stringify(state)}`);*/
            

            this.setState({stepText: "Waiting for Ratio Labs Verification..."})

            // TODO: Handle transaction.

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
                default:
                    break; 
            }
            var valBlocks = 0;

            var leaves;

            while(valBlocks < 2){   
                var currentBlock = await nftProtocol.latestBlock();

                while(currentBlock._block === latestBlock._block){
                    console.log("Waiting for new block...")
                    await new Promise(p => setTimeout(p, 2000));
                    currentBlock = await nftProtocol.latestBlock();
                }

                /*
                var leavesRequest = await gatewayApi.leaves(currentBlock._leaves)

                while(leavesRequest.status !== "success"){
                    console.log("Waiting for valid leaves request...")
                    await new Promise(p => setTimeout(p, 2000));
                    leavesRequest = await gatewayApi.leaves(currentBlock._leaves)
                }

                leaves = leavesRequest.data.leaves;

                if(!leaves.includes(leaf)){
                    console.log("leaf was not in current block.")
                    latestBlock = currentBlock;
                    valBlocks++
                    continue
                }*/

                console.log(currentBlock._leaves)

                var leaves;

                var inBlock = true;

                var leavesRequest = 0;
                
                while(leavesRequest < 2){
                    try{
                        var leavesData = uint8arrays.concat(await all(await ipfs.cat("/ipfs/" + currentBlock._leaves, {timeout: 2000})))

                        var leavesDecode = new TextDecoder().decode(leavesData).toString();

                        var leavesJSON = JSON.parse(leavesDecode);

                        leaves = leavesJSON.leaves;

                        console.log(`leaves: ${leaves}`);

                        if(!leaves.includes(leaf)){
                            inBlock = false;  
                        }
                        break;
                    }
                    catch(e){
                        console.log(e)
                        leavesRequest++
                        await new Promise(p => setTimeout(p, 2000))
                    }
                    if(leavesRequest === 2){
                        this.setState({createError: "Unexpected IPFS retreival error!", stepText: ""}); // Potential valid nft error. TODO: verification tool
                    }
                }

                if(!inBlock){
                    continue;
                }

                break;
            }

            try{
                await ipfs.stop()
            }
            catch{
                console.log("ipfs couldn't be stopped.")
            }

            var tree = new MerkleTree(leaves, keccak256, {sort: true})

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
            try{
                await ipfs.stop();
            }catch{}
        }

        //var version =  await global.ipfs.version()

        this.props.setLoading(false)
    }

    render(){

        var createButton = this.props.loading ?  <Button id="createButton" color="black" loading size="huge">Loading</Button> : <Button id="createButton" color="black" onClick={this.createNFT} size="huge">Create NFT</Button> 

        return(
            <div id="subComponent">
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
import React, { Component} from "react";

import {Button, Icon, Popup, Image, Header, Dropdown, Divider} from 'semantic-ui-react';

import QRCode from 'qrcode';

class Display extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {accounts: null, account: null, balance: null};
    }

    componentDidMount = async () =>{
        console.log("display mount")

        this.wallet = this.props.wallet;

        await this.props.initializeNetworkData();

        await this.props.initializeWallet();
        /*
        var providers = this.wallet.getProviders()

        var url = providers[networkData[this.props.network.toString()].chainName].url

        await this.props.changeProvider(null, {value: url});*/
    }

    copyAccount = () =>{
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
                <div id="compHeader"> <button id="back" onClick ={this.props.backUnlock}><Icon size="large" name = "arrow left"/> Lock</button> <Header><div className="linkButton">Display</div></Header> </div>
                <div id ="networkDropdown">
                    <Dropdown button selection placeholder={this.props.providerPlaceholder} text={this.props.providerText} value={this.props.providerValue} options = {this.props.networks} onChange={this.props.changeProvider}></Dropdown>
                    <Icon name="globe"/>
                </div ><br/>
                <Divider />
                <Dropdown button selection placeholder={this.props.accountPlaceholder} options ={this.props.walletAccounts} onChange = {this.props.changeAccount}/>
                <Popup content="Copied!" on='click' position="top right" offset={[20,10]} trigger = {<Icon name="copy" onClick={this.copyAccount}/>}/><br/><br/>
                <Image src = {this.props.assetImage} size = "mini" circular/>
                <Header inverted>{this.props.balance} {this.props.asset}</Header>
                <Button secondary onClick={this.props.sendPrompt}>Send</Button>
                <Popup on ='click' position="top right" offset={[100,10]} trigger = {<Button secondary onClick={this.updateQr}>Receive</Button>} content = {
                    <div>
                        <Image src = {this.state.qrCode} size="medium"/>
                        <div id="receiveAddress">{this.props.account} &emsp; <Popup content="Copied!" on='click'  trigger = {<Icon name="copy" onClick={this.copyAccount}/>}/></div>
                    </div>
                } />
            </div>
        ) 
    }
}

export default Display;
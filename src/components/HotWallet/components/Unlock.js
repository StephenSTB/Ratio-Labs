import React, {Component} from "react";

import {Button, Icon, Form, Image, Header, Divider} from 'semantic-ui-react';

import flame from "../../../logos/wallet/flame.gif"

class Unlock extends Component{

    //var decryptedMnemonic = CryptoJS.AES.decrypt(encryptedMnemonic, this.state.password).toString(CryptoJS.enc.Utf8);
        //console.log(decryptedMnemonic)

    constructor(props){
        super();
        this.props = props;
        this.state = {password: "", error:""}
    }

    componentDidMount() {
        //console.log("Unlock")
        //var encryptedMnemonic = localStorage.getItem("hotWallet");
        console.log(this.props.loadHotWallet)
    }

    setPassword =  async (event) =>{
        this.setState({password: event.target.value})
    }

    close = () =>{
        this.props.loadHotWallet(false)
        this.props.handleClose();
    }

    render(){
        return(
            <div id="unlock">
                <div id="compHeader"> <button id="back" onClick ={this.close}><Icon size="large" name = "arrow left"/></button></div>
                <Image src={flame} size="small"/>
                <Header inverted>Unlock Wallet</Header><br/>
                <Divider/>
                <div id="leftAlign">
                    <Form onSubmit={() => this.props.unlockWallet(this.state.password)} inverted>
                        <Form.Input label='Password:' placeholder='Passsword' type='password' onChange={this.setPassword} />
                        <div>{this.props.error}<br/><br/></div>
                        <Button color='black' onClick={async () => await this.props.unlockWallet(this.state.password)}><div className="linkButton">Unlock</div></Button><br/><br/><br/><br/>
                        <div id="unlockBottom">
                            <button className="linkButton" onClick={() => this.props.importWallet()}><b><u>Import</u> wallet using mnemonic.</b></button> 
                            <button className="linkButton" id="aboutButton" onClick={() => this.props.aboutPrompt()}><b>About</b></button>
                        </div>
                    </Form>
                </div>
            </div>
            )
    }
}

export default Unlock;
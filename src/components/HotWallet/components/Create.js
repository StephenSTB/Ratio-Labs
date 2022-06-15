import React, {Component} from "react";

import {Button, Icon, Segment, Popup, Form, Header} from 'semantic-ui-react';

class Create extends Component{

    constructor(props){
        super();
        this.props = props;
        this.methods = this.props.methods;
    }

    copyMnemonic = () =>{
        navigator.clipboard.writeText(this.props.mnemonic)
    }

    render(){
        return(
                <div id="createWallet">
                    <div id="leftAlign">
                        <div id="compHeader"> <button id="back" onClick ={this.methods.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div className="linkButton">Create</div></Header> </div><br/>
                        Mnemonic: <br/>
                        <Popup content="Copied!" on='click' position="top right"
                        trigger={<Segment inverted onClick={() => this.copyMnemonic()} id="MnemonicText">
                                    <div>{this.props.mnemonic}</div>
                                    <div style={{'width': '100%', 'textAlign': 'right'}}><Icon name="copy"/></div>
                                </Segment>} />
                        <Form inverted onSubmit={() => this.methods.setWallet}>
                            <Form.Input label='Password:' placeholder='Passsword' type='password' onChange={this.methods.setPasswordOne} />
                            <Form.Input label='Confirm Password:' placeholder='Confirm Password' type='password' onChange={this.methods.setPasswordTwo} />
                            <div>{this.props.error}<br/><br/></div>
                            <Button color="black" onClick={this.methods.setWallet}>Create Wallet</Button>
                        </Form>
                    </div> 
                </div>
            )
    }
}

export default Create;

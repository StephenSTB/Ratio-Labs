import React, {Component} from "react";

import {Button, Icon, Form, Header} from 'semantic-ui-react';

class Import extends Component{

    state = {type: "password"}

    constructor(props){
        super();
        this.props = props;
        this.methods = this.props.methods;
    }

    componentDidMount(){
    }

    changeType = async (event) =>{
        if(this.state.type === "password"){
            this.setState({type: "text"})
            return;
        }
        this.setState({type: "password"})
    }

    render(){
        return(
            <div id = "import">
                <div id ="leftAlign">
                    <div id="compHeader"> <button id="back" onClick ={this.methods.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div className="linkButton">Import</div></Header> </div>
                    <Header inverted size="small">Import wallet using mnemonic.</Header><br/><br/>
                    <Form inverted onSubmit={this.methods.setWallet}>
                        <Form.Input label="Mnemonic Phrase:" type={this.state.type} onChange={this.methods.setMnemomnic}/>
                        <Form.Checkbox label = "Show Mnemonic." onChange={this.changeType}/><br/><br/>
                        <Form.Input label="Password:" placeholder="Password" type='password' onChange={this.methods.setPasswordOne}/>
                        <Form.Input label='Confirm Password:' placeholder='Confirm Password' type='password' onChange={this.methods.setPasswordTwo} />
                        <div style={{color: "white"}}>{this.props.error}</div><br/><br/>
                        <Button color="black" onClick={this.methods.setWallet}>Import Wallet</Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default Import;
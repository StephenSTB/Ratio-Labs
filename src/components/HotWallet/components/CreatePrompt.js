import React, {Component} from "react";

import {Button} from 'semantic-ui-react';

class CreatePrompt extends Component{

    render(){
        return(
            <div id="createPrompt">
                <p>Hot Wallet was not found. Create or import hot wallet.</p>
                <Button color="black" onClick={this.props.createWallet}> Create </Button>
                <Button color="black" onClick={this.props.importWallet}> Import </Button>
            </div>
            )
    }
}

export default CreatePrompt;
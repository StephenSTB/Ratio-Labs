import React, {Component} from "react";

import {Icon, Header, Divider, Container} from 'semantic-ui-react';

import diagram from "../../../logos/wallet/about/HotWalletDiagram.png";

class About extends Component{
    constructor(props)
    {
        super()
        this.props = props
    }

    render(){
        return(
            <div id="about">
                <div id="compHeader"> <button id="back" onClick ={this.props.backUnlock}><Icon size="large" name = "arrow left"/></button> <Header><div className="linkButton">About</div></Header> </div>
                <h3>About Hot Wallet.</h3>
                <Container textAlign="left" style={{"marginTop": "1vh"}}>
                    &emsp;The app you are interacting with is called Hot Wallet which provides seamless blockchain interactions. 
                    One of the limiting factors of utilizing blockchains is the transaction based model where each operation a user wants to make must be created in a transaction to be posted on chain. 
                    Wallets which interact with EVM chains today prioritize security creating a slow transaction acceptance model and makes applications such as social media less appealing. 
                    Hot wallet enables users to bypass the transaction acceptance process on the Ratio Labs webpage enabling user friendly interactions. 
                    The Ratio Labs webpage being deployed on IPFS ensures that the same webpage can be accessed each time mitigating risk of unintended transaction sequences.
                </Container>
                <Divider/>
                <div>
                    <h3>How it works.</h3>
                    <img src={diagram} id="diagram"/>
                </div>
            </div>
        );
    }
}

export default About;
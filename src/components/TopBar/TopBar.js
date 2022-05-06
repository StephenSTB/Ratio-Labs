import React, { Component } from "react";

import {Button, Menu, Image, Dimmer, Card, Header, Grid} from 'semantic-ui-react';

import { createMedia } from '@artsy/fresnel'

import RatioSymbol from "../../logos/content/RatioSymbol2.svg";

import "./TopBar.css";

import {Link} from 'react-router-dom';

import metamask from "../../logos/wallet/MetaMask.png";

import coinbase from "../../logos/wallet/Coinbase.png";

import fire from "../../logos/wallet/Fire.png";

import HotWallet from "../HotWallet/HotWallet";

import Polygon from "../../logos/wallet/chains/polygon.png"

import Mumbai from "../../logos/wallet/chains/polygonMumbai.png"

import Ganache from "../../logos/wallet/chains/ganache.png"

const { MediaContextProvider, Media } = createMedia({
    breakpoints: {
      mobile: 0,
      tablet: 768,
      computer: 1024,
    },
  })

class TopBar extends Component{

    constructor(props){
        super();
        this.props = props;
        this.state = {dim: false, loadWallet:false, dimP: false}
    }

    handleOpen = () =>{
        this.setState({dim: true});
    }
    
    handleClose = ()=>{
        this.setState({dim: false, dimP: false});
    }

    loadHotWallet = () =>{    
        this.setState({loadWallet: true})
    }

    providerOpen = () =>{
        this.setState({dimP: true});
    }

    changeProvider = async (network) => {
        await this.props.setProvider(network)
        if(!this.props.unlocked){
            await this.props.updateWeb3(null)
        }
    }


    render(){
        //var ethAccount = this.props.accounts ?  this.props.accounts[0] : "Connect Wallet";

        var walletCardContent = this.state.loadWallet ? 
                                    <HotWallet updateWeb3 = {this.props.updateWeb3} {...this.state} {...this.props}/>
                                    : 
                                    <Card.Content>
                                        <Card.Content>
                                            <Header color="black" style={{"marginTop": "1vh"}}>Connect Wallet</Header>
                                        </Card.Content>
                                        <Card.Content >
                                            <Card.Header > 
                                                <Image src={metamask} onClick={() => this.props.updateWeb3(null).then(() =>{this.setState({dim:false})})}  size="mini" /> 
                                                <Image src={coinbase} onClick={() => this.props.updateWeb3(null).then(() =>{this.setState({dim:false})})}  size="tiny" />
                                                <Image src={fire} onClick={this.loadHotWallet} size="mini"/>
                                            </Card.Header>
                                        </Card.Content>
                                    </Card.Content>;

        return(
            <MediaContextProvider>
                <Media greaterThan='mobile'>

                    <Menu fixed='top' id="TopMenu" borderless>
                        <Menu.Menu position="left" >
                            <Menu.Item><Link to="/"><Image src={RatioSymbol} /></Link></Menu.Item>
                            <Menu.Item>
                                <Link to="/NFT_Menu/Create"><div id="link">NFT</div></Link>
                            </Menu.Item>
                            <Menu.Item>
                                <Link to="/CryptoGameMenu/Mint"><div id="link">CryptoGame</div></Link>
                            </Menu.Item>
                            <Menu.Item>
                                <Link to="/Bridge"><div id='link'>Bridge</div></Link>
                            </Menu.Item>
                             <Menu.Item>
                                <Link to="/Govern"><div id="link">Govern</div></Link>
                            </Menu.Item>
                        </Menu.Menu>
                        
                        <Menu.Menu position="right" />
                            
                            
                        <Menu.Menu position="right" />
                        
                        <Menu.Item position="right">
                            <Button color="black" style={{"marginRight": "1em"}} onClick={this.providerOpen}><img className="networkImg" src={this.props.selectedProviderImage} onClick={this.providerOpen}/></Button>
                            <Button color="black" title={this.props.selectedAccount} onClick={this.handleOpen}><div id="connect">{this.props.selectedAccount}</div></Button>
                        </Menu.Item>
                        <Menu.Menu position="right"/>
                    </Menu>

                    <Dimmer page active ={this.state.dim} onClickOutside={this.handleClose}>
                        <div className="cardStyle">
                            <Card className = "cardStyle" fluid>
                                {walletCardContent}  
                            </Card>
                        </div>
                    </Dimmer>
                    <Dimmer page active={this.state.dimP} onClickOutside={this.handleClose}>
                        <div className="cardStyle">
                            <Card className = "cardStyle" fluid>
                                <Card.Content>
                                    <Grid columns={2}>
                                        <Grid.Column textAlign="right">
                                            <Button color="black"><div style={{marginRight: "2em"}} onClick={() => this.changeProvider("137") }><img className="networkImg" src={Polygon} style={{marginRight: "1em"}}/>Polygon </div></Button>
                                        </Grid.Column>
                                        <Grid.Column textAlign="left">
                                            <Button color="black"><div style={{marginRight: "2em"}} onClick={() => this.changeProvider("80001")}><img className="networkImg" src={Mumbai} style={{marginRight: "1em"}}/>Mumbai</div></Button>
                                        </Grid.Column> 
                                    </Grid>
                                </Card.Content>
                                <Card.Content>
                                    <Grid columns={2} >
                                        <Grid.Column textAlign="right">
                                            <Button color="black" ><div style={{marginRight: "2em"}} onClick={() =>this.changeProvider("1337")}><img className="networkImg" src={Ganache} style={{marginRight: "1em"}}/>Ganache </div></Button>
                                        </Grid.Column>
                                        <Grid.Column textAlign="left">
                                        </Grid.Column> 
                                    </Grid>
                                </Card.Content>
                            </Card>
                        </div>
                    </Dimmer>
                
                </Media>
            </MediaContextProvider>
        );
    }
}

export default TopBar;


import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import Particles from "react-tsparticles";

import { loadFull } from "tsparticles";

//import RatioText from "../../logos/content/RatioLabsMilkShake.png";

import RatioText from "../../logos/home/RatioLabsLogo_1266x462.png"

import {Image, Segment, Divider, Card, Icon} from 'semantic-ui-react';

import './Home.css';

//import oracleLogo from "../../logos/home/RatioOracleLogo.png";

//import progressLogo  from "../../logos/home/RatioProgressLogo0.png";

//import rocketLogo from "../../logos/home/RatioRocketLogo.png";

// placeImage from "../../logos/content/white-image.png";

import hotWallet from "../../logos/home/HotWalletLogo.png";

import cryptoMonkey from "../../logos/home/CryptoMonkeyCard.png";

import cryptoGame from "../../logos/home/CryptoGameLogo.png"

import gitcoinLogo from "../../logos/home/GitcoinLogo.png"

import bridgeLogo from "../../logos/home/BridgeLogo2.png"

import governLogo from "../../logos/home/GovernLogo.png"

class Home extends Component{
    constructor(props){
        super();
        this.props = props;
        this.state = {particle: null}
    }

    About(){
        return(
            <div>
                <Segment inverted color="black" id="About">
                    <div id="description1">A Research and Development Project,</div>
                    <div id="description2">Building Web3 Technologies.</div>
                    <a href="#projectsDiv" id="exploreLink"><button id="exploreButton">Explore</button></a>
                    <Divider id="projectsDiv" />
                    <div id="projectsHeader">Ratio Labs Projects</div>
                    <div id="projects">
                        <div className="projectCard">
                            <img alt="Hot Wallet" src={hotWallet} className="projectImg"/>
                            <Divider className="projectCardDivder"/>
                            <Card.Header className="projectCardHead">Hot Wallet</Card.Header>
                            <Card.Content className="projectCardDesc">
                                Enables seamless smart contract interactions via its autonomous signatory transaction system.
                            </Card.Content>
                        </div>
                        <div className="projectCard" >
                            <img alt="Crypto Monkey NFT" src={cryptoMonkey} className="projectImg"/>
                            <Divider className="projectCardDivder"/>
                            <Card.Header className="projectCardHead">Non-Fungible Token Protocol</Card.Header>
                            <Card.Content className="projectCardDesc">
                                Provides reliable NFT distributor verificaiton via a central oracle.
                            </Card.Content>
                        </div>
                        <div className="projectCard">
                            <img alt="Crypto Game Meta" src={cryptoGame} className="projectImg"/>
                            <Divider className="projectCardDivder"/>
                            <Card.Header className="projectCardHead">Crypto Game</Card.Header>
                            <Card.Content className="projectCardDesc">
                                A multi-stage NFT GameFi experience focused on exploring concepts such as NFT's, GameFi and VRF Oracle Systems.
                            </Card.Content>
                        </div>
                        <div className="projectCard">
                            <img alt="Bridge" src={bridgeLogo} className="projectImg"/>
                            <Divider className="projectCardDivder"/>
                            <Card.Header className="projectCardHead">Bridge</Card.Header>
                            <Card.Content className="projectCardDesc">
                                Enables non EVM compatible legacy cryptocurrencies to transfer value onto EVM chains via a colateralized POS VRF oracle.
                            </Card.Content>
                        </div>
                        <div className="projectCard" >
                            <img alt="Govern" src={governLogo} className="projectImg"/>
                            <Divider className="projectCardDivder"/>
                            <Card.Header className="projectCardHead">Govern</Card.Header>
                            <Card.Content className="projectCardDesc">
                                A protocol enabling multi-chain DAO governance via the Ratio token and POS VRF oracle.
                            </Card.Content>
                        </div>
                    </div>

                    <Divider id="socialsDiv"/>
                    <div id="socials">
                        <Icon name="github" inverted size="huge" color="purple"/>
                        <a href="https://twitter.com/0xRatioLabs"><Icon name="twitter" inverted size="huge" color="blue"/></a>
                        <Icon ><img alt="Gitcoin" src={gitcoinLogo} id="gitcoinLogo"/></Icon>
                        
                    </div>
                    <div id="copywrite">
                        <p>Ratio Labs &copy; {new Date().getFullYear()}</p>
                    </div>
                    {/*
                    <Grid className="formatGrid" style={{"marginTop": "2vh"}}>
                        <Grid.Row>
                            <Grid.Column width={10} textAlign="left">
                                <div id="missionHeader">The Mission</div>
                                <p className="pState"> &emsp; The primary goal of the projects featured on this site are to enable innovative interactions with web3 technologies. 
                                                                To acheive this goal, projects designed for this site have been structured to solve use cases including, Seamless smart contract interactions, 
                                                                Digital asset verification and distribution, NFT Defi gamification, 
                                                                Cross chain asset transfer for legacy cryptocurrencies, and multichain DAO governance. Read below about the inovative projects that are being worked on. </p>
                                
                                <List style={{"marginTop": "3vh",color: "#54c18a"}}>
                                    <List.Item>
                                        <List.Icon name="ethereum"/>
                                        <List.Content className="listItem">Hot wallet enables seamless smart contract interactions via its autonomous signatory transaction system.</List.Content>
                                    </List.Item>
                                    <br/>
                                    <List.Item>
                                        <List.Icon name="ethereum"/>
                                        <List.Content className="listItem">Ratio NFT Protocol provides reliable NFT distributor verificaiton via a central oracle.</List.Content>
                                    </List.Item>
                                    <br/>
                                    <List.Item>
                                        <List.Icon name="ethereum"/>
                                        <List.Content className="listItem">CryptoGame is a multi-stage NFT Defi game focused on exploring concepts such as NFT's, GameFi VRF Oracle Systems </List.Content>
                                    </List.Item>
                                    <br/>
                                    <List.Item>
                                        <List.Icon name="ethereum" />
                                        <List.Content className="listItem">Bridge enables non EVM compatible legacy cryptocurrencies to transfer value onto EVM chains via a colateralized POS VRF oracle.</List.Content>
                                    </List.Item>
                                    <br />
                                    <List.Item>
                                        <List.Icon name="ethereum"/>
                                        <List.Content className="listItem">Govern allows multi-chain protocol and token economic changes via the Ratio token and POS VRF oracle.</List.Content>
                                    </List.Item>
                                </List>
                            </Grid.Column>
                            <Grid.Column width={6} floated="right" textAlign="justified" verticalAlign="bottom">
                                <img src={rocketLogo} id="oracleImg"/>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    
                    <div id="space"/>
                    <Divider/>
                    <Grid  className="formatGrid">
                        <Grid.Row>
                            <Grid.Column width={6} textAlign="justified" verticalAlign="bottom">
                                <img src={progressLogo} id="oracleImg"/>
                            </Grid.Column>
                            <Grid.Column floated='right' width={10} textAlign="justified" verticalAlign="bottom">
                                <div id="designHeader">Progressive Project Design</div>
                                <p className="pState"> &emsp; The nature of blockchain interactions targeted by these projects has a progressive design which improves research and development of future projects. Periphery for direct blockchain interactions (HotWallet). Intermediary protocol for data security using blockchains (Ratio NFT Protocol). Fair outcome protocol for GameFi via central VRF oracle (Crypto Game). cross chain transfers from legacy cryptocurrencies (BTC, DOGE) to EVM Chain (Matic) via DPOS VRF oracle (Ratio Bridge). Large validator protocol for multichain dynamic governance via POS VRF oracle (Govern).</p>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    <div id="space"/>
                    <Divider/>
                    <Grid className="formatGrid">
                        <Grid.Row>
                            <Grid.Column width={10} textAlign="left" verticalAlign="middle">
                                <div id="designHeader">Ratio Oracle Systems</div>
                                <p className="pState"> &emsp; Work being done at Ratio Labs involves developing technologies which aggregate information onto blockchains in a trustless manor. The approach taken for this task has been to leverage VRF (Verifiable, Random Function) consensus models to develop Ratio Labs Oracle Systems. The specifications of these systems can be seen in their respective documentation.</p>
                                
                            </Grid.Column>
                            <Grid.Column width={6} floated="right" textAlign="justified" verticalAlign="bottom">
                                <img src={oracleLogo} id="oracleImg"/>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    */}
                    
                </Segment>
            </div>
        );
    }

    particlesInit = async (main) => {
        console.log(main);
    
        // you can initialize the tsParticles instance (main) here, adding custom shapes or presets
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        await loadFull(main);
    };

    particlesLoaded = (container) => {
        console.log(container);
    }
    
    render(){
        return(
            <div className="Home">
                <Image src={RatioText} id = "Ratio-Text"/>
                {/*this.state.particle*/}
                <Particles id = 'particles-js' init={this.particlesInit} loaded={this.particlesLoaded} options={{
                        "particles": {
                        "number": {
                            "value": 150,
                            "density": {
                            "enable": true,
                            "value_area": 800
                            }
                        },
                        "color": {
                            "value": "#000000"
                        },
                        "shape": {
                            "type": "circle",
                            "stroke": {
                            "width": 0,
                            "color": "#000000"
                            },
                            "polygon": {
                            "nb_sides": 6
                            },
                            "image": {
                            "src": "img/github.svg",
                            "width": 100,
                            "height": 100
                            }
                        },
                        "opacity": {
                            "value": 0.40246529723245905,
                            "random": false,
                            "anim": {
                            "enable": false,
                            "speed": 1,
                            "opacity_min": 0.1,
                            "sync": false
                            }
                        },
                        "size": {
                            "value": 11.83721462448409,
                            "random": true,
                            "anim": {
                            "enable": false,
                            "speed": 40,
                            "size_min": 0.1,
                            "sync": false
                            }
                        },
                        "line_linked": {
                            "enable": true,
                            "distance": 150,
                            "color": "#ffffff",
                            "opacity": 0.4,
                            "width": 1
                        },
                        "move": {
                            "enable": true,
                            "speed": 2,
                            "direction": "none",
                            "random": false,
                            "straight": false,
                            "out_mode": "out",
                            "bounce": false,
                            "attract": {
                            "enable": false,
                            "rotateX": 600,
                            "rotateY": 1200
                            }
                        }
                        },
                        "interactivity": {
                        "detect_on": "canvas",
                        "events": {
                            "onhover": {
                            "enable": true,
                            "mode": "repulse"
                            },
                            "onclick": {
                            "enable": true,
                            "mode": "push"
                            },
                            "resize": true
                        },
                        "modes": {
                            "grab": {
                            "distance": 400,
                            "line_linked": {
                                "opacity": 1
                            }
                            },
                            "bubble": {
                            "distance": 400,
                            "size": 40,
                            "duration": 2,
                            "opacity": 8,
                            "speed": 3
                            },
                            "repulse": {
                            "distance": 71.92807192807193,
                            "duration": 0.4
                            },
                            "push": {
                            "particles_nb": 4
                            },
                            "remove": {
                            "particles_nb": 2
                            }
                        }
                        },
                        "retina_detect": true
                    }}  >
                </Particles>
            
            <this.About/>
        </div>
        );
    }
}

export default Home;
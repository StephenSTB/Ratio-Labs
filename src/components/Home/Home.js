import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

//import Particles from 'react-particles-js';

import Particles from "react-tsparticles";

import RatioText from "../../logos/content/RatioLabsMilkShake.png";

import {Container, Image, Segment, List} from 'semantic-ui-react';

import './Home.css';

class Home extends Component{
    constructor(props){
        super();
        this.props = props;
        this.state = {particle: null}
    }

    About(){
        return(
            <div>
                <Segment inverted color="black" id="About"  >
                    <Container style={{"margin-top": "2vh"}} textAlign="left">
                        <div id="missionHeader">The Mission</div>
                        <p className="pState"> &emsp; The primary goal of the projects featured on this site are to enable innovative interactions with blockchain technologies. To acheive this goal, projects designed for this site have been structured to solve real world use cases including, Seamless smart contract interactions, Digital asset verification and distribution, NFT gamification with virtual reality visualization, Cross chain asset transfer for legacy cryptocurrencies, and multichain DAO governance. Read bellow about the inovative projects that are being worked on. </p>
                        <List style={{"margin-top": "3vh"}}>
                            <List.Item>
                                <List.Icon name="ethereum"/>
                                <List.Content className="listItem">Hot wallet enables seamless smart contract interactions via its autonomous signatory transaction system.</List.Content>
                            </List.Item>
                            <br/>
                            <List.Item>
                                <List.Icon name="ethereum"/>
                                <List.Content className="listItem">Ratio NFT Protocol provides reliable digital asset verificaiton and distribution.</List.Content>
                            </List.Item>
                            <br/>
                            <List.Item>
                                <List.Icon name="ethereum"/>
                                <List.Content className="listItem">CryptoGame is a multi-stage NFT game focused on exploring concepts such as NFT's, GameFi. VRF Oracle Systems and Virtual Reality</List.Content>
                            </List.Item>
                            <br/>
                            <List.Item>
                                <List.Icon name="ethereum" />
                                <List.Content className="listItem">Bridge enables non EVM compatible legacy cryptocurrencies to transfer value onto EVM chains via a DPOS VRF oracle.</List.Content>
                            </List.Item>
                            <br />
                            <List.Item>
                                <List.Icon name="ethereum"/>
                                <List.Content className="listItem">Govern allows protocol and token economic changes via the Ratio token and POS VRF oracle.</List.Content>
                            </List.Item>
                            
                        </List>
                        <div id="designHeader">Progressive Project Design</div>
                        <p className="pState"> &emsp; The nature of blockchain interactions targeted by these projects has a progressive design which can be summarized as follows. Periphery for direct blockchain interactions (HotWallet). Intermediary protocol for data security using blockchains (Ratio NFT Protocol). Fair outcome protocol for GameFi via central VRF oracle (CryptoGame). cross chain transfers from legacy cryptocurrencies (BTC, DOGE) to EVM Chain (Matic) via DPOS VRF oracle (Ratio Bridge). Large validator protocol for multichain dynamic governance via POS VRF oracle (Govern).</p>
                        <div id="designHeader">Ratio Oracle Systems</div>
                        <p className="pState"> &emsp; The bulk of the work being done at Ratio Labs involves developing technologies which aggregate information onto blockchains in a trustless manor. The approach taken for this task has been to leverage VRF (Verifiable, Random Function) consensus models to develop Ratio Labs Oracle Systems. The specifications of these systems can be seen in their respective documentation.</p>
                        {/*<div id="engageHeader">Engage in emerging projects in the cryptocurrency space.</div>
                        */}
                    </Container>
                </Segment>
            </div>
        );
    }

    render(){
        return(
            <div className="Home">
                <Image src={RatioText} id = "Ratio-Text"/>
                {/*this.state.particle*/}
                <Particles id = 'particles-js' params={{
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
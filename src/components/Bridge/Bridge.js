import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Segment, Container} from 'semantic-ui-react';

import "./Bridge.css"

class Bridge extends Component{
    constructor(props){
        super();
        this.props = props;
    }
    render(){
        return(
            <div id="bridgeComponent">
                <Segment basic inverted id="banner" style={{"marginTop": "5vh", height: "25vh"}}>
                        <Container textAlign="left">
                            <div id="bannerText">Bridge</div>
                        </Container>
                </Segment>
            </div>
        );
    }
}

export default Bridge;
import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Segment, Container} from 'semantic-ui-react';

import "./Bridge.css"

import Message from "../Message/Message";

class Bridge extends Component{
    constructor(props){
        super();
        this.props = props;
    }
    render(){
        return(
            <div id='baseComponent'>
                <div id="subSpace" />
                <div id="subComponent" >
                    <Segment basic inverted id="banner">
                            <Container textAlign="left">
                                <div id="bannerText">Bridge</div>
                            </Container>
                    </Segment>
                    <Message message={"Research In Progress..."}/>
                </div>
            </div>
        );
    }
}

export default Bridge;
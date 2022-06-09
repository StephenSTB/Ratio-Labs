import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {BrowserRouter, Routes, Route, } from "react-router-dom";

import Home from "../Home/Home";

import Govern from "../Govern/Govern";

import Bridge from "../Bridge/Bridge";

import CryptoGameMenu from "../CryptoGame/CryptoGameMenu";

import NFT_Menu from "../NFT/NFT_Menu";

class Main extends Component{
    constructor(props){
        super();
        this.props = props;
    }

    render(){
        return(
            <div>
                <Routes>
                    <Route path="/" element = {<Home/>} />
                    <Route path="/Govern" element = {<Govern/>}/>
                    <Route path="/Bridge" element = {<Bridge/>}/>
                    <Route path="/CryptoGameMenu/*" element = {< CryptoGameMenu {...this.props}/> }/> 
                    <Route path="/NFT_Menu/*" element = {< NFT_Menu {...this.props} setLoading = {this.props.setLoading}/> }/> 
                </Routes>
            </div>
        );
    }

}

export default Main;
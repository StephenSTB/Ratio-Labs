import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Menu} from 'semantic-ui-react';

import {Link, Routes, Route, useParams} from 'react-router-dom';

//import { createMedia } from '@artsy/fresnel';

import "./NFT.css";

import Create from "./Create";

import Display from "./Display";

//import NFT_ABOUT from "./NFT_About";

class NFT_Menu extends Component{
    constructor(props){
        super();
        this.props = props;
    }
    render(){
        const DisplayW = () =>{
            const params = useParams();
            return <Display {...{...this.props, match: {params}}} setLoading = {this.props.setLoading}/>
        }

        return(
            <div id="baseComponent">
                <Menu id="subMenu" borderless>
                    <Menu.Menu position="right">
                        <Menu.Item>
                            <Link to="Create"><div id="link">Create</div></Link>
                        </Menu.Item>
                        <Menu.Item as={Link} to="Display/0x">
                            <div id="link">Display</div>
                        </Menu.Item>
                        {/*
                            <Menu.Item>
                            <Link to="NFT_About"><div id="link">About</div></Link>
                        </Menu.Item>*/
                        }
                        
                    </Menu.Menu>
                    <Menu.Menu position="right">
                        <Menu.Item>
                        </Menu.Item>
                    </Menu.Menu>
                </Menu>
                <Routes>
                    <Route path="Create" element = {<Create {...this.props} setLoading = {this.props.setLoading}/>}/>
                    <Route path="Display/:searchContract" element = {<DisplayW/>}/>
                    {/*<Route path="NFT_About" element = {<NFT_ABOUT/>}/>*/}
                </Routes>
            </div>
        );
    }
}

export default NFT_Menu;
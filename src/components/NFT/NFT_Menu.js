import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Menu, Segment,} from 'semantic-ui-react';

import {Link,Routes, Route} from 'react-router-dom';

import { createMedia } from '@artsy/fresnel';

import "./NFT.css";

import Create from "./Create";


const { MediaContextProvider, Media } = createMedia({
    breakpoints: {
      mobile: 0,
      tablet: 768,
      computer: 1024,
    },
  })


class NFT_Menu extends Component{
    constructor(props){
        super();
        this.props = props;
    }
    render(){
        return(
            <div id="NFT">
                <MediaContextProvider>
                    <Media greaterThan='mobile'>
                        <Menu id="NFT_Menu" borderless style={{"padding-top": "6vh"}}>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    <Link to="Create"><div id="link">Create</div></Link>
                                </Menu.Item>
                            </Menu.Menu>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    
                                </Menu.Item>
                            </Menu.Menu>
                        </Menu>
                        <Routes>
                            <Route path="Create" element = {<Create {...this.props} setLoading = {this.props.setLoading}/>}/>
                        </Routes>
                    </Media>
                </MediaContextProvider>
            </div>
        );
    }
}

export default NFT_Menu;
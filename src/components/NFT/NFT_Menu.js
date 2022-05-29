import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Menu, Segment,} from 'semantic-ui-react';

import {Link, Routes, Route, useParams} from 'react-router-dom';

import { createMedia } from '@artsy/fresnel';

import "./NFT.css";

import Create from "./Create";

import Display from "./Display";

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
        const DisplayW = () =>{
            const params = useParams();
            return <Display {...{...this.props, match: {params}}} setLoading = {this.props.setLoading}/>
        }

        return(
            <div id="NFT">
                <MediaContextProvider>
                    <Media greaterThan='mobile'>
                        <Menu id="NFT_Menu" borderless style={{"padding-top": "6vh"}}>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    <Link to="Create"><div id="link">Create</div></Link>
                                </Menu.Item>
                                <Menu.Item>
                                    <Link to="Display/0x"><div id="link">Display</div></Link>
                                </Menu.Item>
                            </Menu.Menu>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    
                                </Menu.Item>
                            </Menu.Menu>
                        </Menu>
                        <Routes>
                            <Route path="Create" element = {<Create {...this.props} setLoading = {this.props.setLoading}/>}/>
                            <Route path="Display/:searchContract" element = {<DisplayW/>}/>
                        </Routes>
                    </Media>
                </MediaContextProvider>
            </div>
        );
    }
}

export default NFT_Menu;
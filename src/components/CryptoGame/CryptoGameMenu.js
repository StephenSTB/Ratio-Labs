import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Menu, Segment,} from 'semantic-ui-react';

import {Link,Routes, Route} from 'react-router-dom';

import { createMedia } from '@artsy/fresnel';

import "./CryptoGame.css";

import Mint from "./Mint";

import View from "./View";

const { MediaContextProvider, Media } = createMedia({
    breakpoints: {
      mobile: 0,
      tablet: 768,
      computer: 1024,
    },
  })


class CryptoGameMenu extends Component{
    constructor(props){
        super();
        this.props = props;
    }

    render(){
        return(
            <div id="Game">
                <MediaContextProvider>
                    <Media greaterThan='mobile'>

                        <Menu id="GameMenu" borderless style={{"padding-top": "6vh"}}>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    <Link to="Mint"><div id="link">Mint</div></Link>
                                </Menu.Item>
                                <Menu.Item>
                                    <Link to="View"><div id="link">View</div></Link>
                                </Menu.Item>
                            </Menu.Menu>
                            <Menu.Menu position="right">
                                <Menu.Item>
                                    
                                </Menu.Item>
                            </Menu.Menu>
                        </Menu>
                        <Routes>
                            <Route path="Mint" element = {<Mint {...this.props}/>}/>
                            <Route path="View" element = {<View {...this.props}/>}/>
                        </Routes>
                    </Media>
                </MediaContextProvider>
            </div>
        );
    }
}

export default CryptoGameMenu;
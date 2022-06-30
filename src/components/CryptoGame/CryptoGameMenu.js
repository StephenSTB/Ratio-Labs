import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';

import {Menu} from 'semantic-ui-react';

import {Link,Routes, Route} from 'react-router-dom';

//import { createMedia } from '@artsy/fresnel';

import "./CryptoGame.css";

import Mint from "./Mint";

import View from "./View";

class CryptoGameMenu extends Component{
    constructor(props){
        super();
        this.props = props;
    }

    render(){
        return(
            <div id="baseComponent">
                <Menu id="subMenu" borderless>
                    <Menu.Menu position="right">
                        <Menu.Item>
                            <Link to="Mint"><div id="link">Mint</div></Link>
                        </Menu.Item>
                        {/**
                            <Menu.Item>
                                <Link to="View"><div id="link">View</div></Link>
                            </Menu.Item>
                            */}
                        
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
            </div>
        );
    }
}

export default CryptoGameMenu;
import React, {Component} from 'react';

import 'semantic-ui-css/semantic.min.css';

import 'aframe'

/*import 'aframe-gif-shader'*/

import floor from "./Content/Images/Marbel-009.jpg";

//import rainbow from "./Content/Images/Rainbow_on_the_Azores.jpg"

import sky from "./Content/Images/360sky.jpg"

//import wall from "./Content/Images/Marbel-009.jpg"

import ground from "./Content/Images/ground.jpg"

import concrete from "./Content/Images/Concrete-011.jpg"

//import chairM from "./Content/Models/chair/scene.glb"

import "./AframeComponents/color-toggle"

import "./AframeComponents/target-marker"

import "./AframeComponents/mover"

import "./AframeComponents/return-emitter"

import deployedContracts from "../../data/Deployed_Contracts.json";

class View extends Component{
    constructor(props){
        super();
        this.props = props;

        this.state ={images: null, assets: null}
    }

    componentDidMount = async () =>{


        if(this.props.provider !== undefined){

            var images = [];

            var assets = [];

            /*
            for(var a in deployedContracts[this.props.provider]){
                console.log(a)
                images.push(<a-image src={deployedContracts[this.props.provider][a].uri}></a-image>)
            }*/

            console.log(deployedContracts[this.props.provider]["Ratio Card Base"])

            var uri = "http://ipfs.io/ipfs/" + deployedContracts[this.props.provider]["PolyCard Ten Common"].uri.slice(7);

            console.log(uri);

            
            images.push(<a-entity position="0 5 -2" animation="property: rotation; to: 0 360 0; easing: linear; dur:5000; loop:true">
                            <a-box height="1.5" width="1" depth=".1"  color="black" ></a-box>
                            <a-image height="1.5" width="1" position="0 0 .052" src={uri}></a-image>
                            <a-image height="1.5" width="1" position="0 0 -.052" rotation="0 180 0" src={uri}></a-image>
                        </a-entity>
                        )
            
            //assets.push(<aframe-html-shader id="gifImg" src={uri}></aframe-html-shader>)

            //images.push(<a-entity geometry="primitive:box;" height="1" width="1" position="0 3 -3" ></a-entity>)
                        

            this.setState(() => ({images, assets}))
        }

    }

    render(){
        return(
            <div id="ViewComponent">
                <a-scene cursor="rayOrigin:mouse">
                    <a-assets>
                        {/*<a-asset-item id="chair" src={chairM}></a-asset-item>*/}

                        <a-asset-item id="floor" src = {floor}></a-asset-item>

                        <a-asset-item id="ground" src ={ground}></a-asset-item>

                        {/*this.state.assets*/}
                    </a-assets>

                    <a-camera position="0 5 0">
                        <a-cursor cursor="fuse:true; fuse-timeout:3000; rayOrigin:mouse" ></a-cursor>
                    </a-camera>

                    <a-sky src ={sky}></a-sky>

                    <a-image height="425" width=" 425" rotation="-90 0 0" src ={concrete} ></a-image>

                    {this.state.images}

                    {/*<a-entity position="0 2 -4" rotation="0 25 0" geometry="primitive:box;" material="shader:gif;src:url(https://media0.giphy.com/media/xT9IgsOaEG15pWz17y/giphy.gif)"></a-entity>*/}

                    {/*<a-plane width="425" height="425" rotation="-90 0 0"  material="src:#wall;"/>*/}

                    {/*<a-sphere position= "0 3 -4" radius="1.25" color="#EF2D5E" mover></a-sphere>
                    <a-cylinder position="2 0.75 -3" radius="0.5" height="1.5" color="#FFC65D" color-toggle return-emitter></a-cylinder>
                    <a-plane position="0 0 -4" rotation="-90 0 0" width = "8" height="8" color="#7BC8A4" return-emitter></a-plane>
                    <a-box  position="-1.5 1 -2.5" rotation="0 0 0" color="#cbedca" target-marker animation="property: rotation; to: 0 360 0; easing: linear; dur:5000; loop:true" return-emitter></a-box>
                    <a-entity position="0 .65 -1" scale=".001 .001 .001" gltf-model="#chair"></a-entity>
                    
                    */}    

                    {/*<a-image src={wall} height="13.3137" width="20" position="0  6.65685 -10"></a-image>*/}

                    {/*a-entity id="rig">
                        <a-entity camera look-controls wsad-controls position="0 1.6 0">
                            <a-entity cursor="fuse:true; fuseTimeout:3000; rayOrigin:mouse" position="0 0 -1" geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
                                    material="color: black; shader: flat">

                            </a-entity>
                        </a-entity>
                    </a-entity>*/}
                    

                </a-scene>
            </div>
        )
    }
}

export default View
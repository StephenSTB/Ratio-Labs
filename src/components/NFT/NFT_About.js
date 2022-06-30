import React, { Component } from "react";

import 'semantic-ui-css/semantic.min.css';

import {Segment, Container, Divider, TextArea, Popup} from 'semantic-ui-react';

import basicNFTmodel from "../../logos/nftProtocol/BasicNFTModel.png"

import basicRatioNFTmodel from "../../logos/nftProtocol/BasicRatioNFTModel.png"

import typicalNFTcreation from "../../logos/nftProtocol/TypicalNFTCreation.png"

import CryptoMonkeyBadNFT from "./CryptoMonkeyBadNFT.json";

import CryptoMonkeyRatioNFT from "./CryptoMonkeyRatioNFT.json";

import nftProtocolDiagram from "../../logos/nftProtocol/NFTProtocolDiagram.png"

class NFT_About extends Component{

    constructor(props){
        super();
        this.props = props;
    }

    render(){
        return(
            <div id="subComponent">
                <Segment basic inverted id="banner" style={{height: "25vh"}}>
                        <Container textAlign="left">
                            <div id="bannerText">About</div>
                            <p id="bannerSub">Non-Fungible Token Protocol</p>
                        </Container>
                </Segment>
                <Container textAlign="left" style={{color: "black", "marginTop" : "2vh"}}>
                            <h2>Introduction</h2>
                            <p className="aboutP" id="introP">
                                &emsp;&emsp;The emerging landscape of NFT's within the cryptocurrency space has raised the question, how can data which is natively in the public sphere (through technologies such as IPFS) be owned and provide value to the owners. 
                                The NFT protocol provided by Ratio Labs ensures digital asset ownership is properly recognized and enables value rich environments for owners of these NFT assets.
                            </p>
                            <Divider/>
                            <h2>The NFT Dilemma</h2>
                            <div id="nftDilemma">
                                <p className="aboutP" id="dilemmaP">
                                    &emsp;&emsp;With the recent hype on NFT's, Ratio Labs has found it interesting that some of the concepts regarding NFT digital asset ownership have been glossed over and concepts related to such have been missed.
                                    So, you might ask what really is an NFT? This concept can best be described utilizing some basic aspects of the widely used standards of NFT's today namely the ERC721 standard and IPFS. 
                                    The ERC721 standard simple provides a way for some data off chain to be pointed to on chain through what is referred to as a token URI. This URI may have sub-data related to it which is represented by pointers to sub-URIs or token ID's which are owned by participants of the NFT contract (see Basic NFT Onwership Model). 
                                    Many URI's in NFT's today refer to centralized distributors of the URI data diminishing ownership and censorship resistance. IPFS mitigates this by allowing nft owners/anyone to host the URI data representing their NFT. Many URI's also point to data with no relation to inherent contract or distributor ownership. 
                                    Due to this property, NFT platforms today are boged down by fake NFTs enabling scammers to dupe average participants. This is where an NFT protocol is needed to properly validate nft contracts via their distributors.
                                    The Ratio Labs NFT protocol fills this need by providing digital assets which have strong ownership relationships in all aspects while retaining decentralization.
                                </p>
                                <div id="nftDilemmaSpace"/>
                                <div id="nftModels">
                                    <img src={basicNFTmodel} id="basicNFTmodel" alt=""/>
                                    <img src={basicRatioNFTmodel} id="basicRatioNFTmodel" alt=""/>
                                </div>
                            </div>
                            <h2>The Current NFT Standard.</h2>
                            <div id="nftStandard">
                                <p className="aboutP">
                                    NFT asset JSON example,
                                    <br />
                                    CID: QmQcvZyGRbxiW85Uy6rvKMDXoMRT96pNJCcMTZnFKgRhAo
                                    <br />
                                    CryptoMonkeyBadNFT.json:
                                </p>
                                <TextArea id="badNFT">{JSON.stringify(CryptoMonkeyBadNFT, null, 4)}</TextArea>
                                <p className="aboutP">
                                    &emsp;&emsp;The previous format is one that can be found widely across NFT's  proliferating currently in the cryptocurrency space. 
                                    The Issue with this format is as follows. Given that NFT JSON does not a reference the distributor address of the organization releasing the NFT,  
                                    potential conflicts can occur regarding the validity of the initial ownership of the distributed content. 
                                    If an entity attempts to claim ownership of the content by posting transactions including the CID of the CryptoMonkeyBadNFT.json, 
                                    A bad actor has the potential to front run the transaction of the honest distributor of content and attempt to claim the content ownership under another contract. 
                                    Ownership associations made in the description such as, Collection by Ratio labs aid in initial ownership identification 
                                    but does not provide a direct link to initial on-chain ownership of the asset which enables quick proofs of asset ownership regardless of blockchain transaction order 
                                    or human intervention.  
                                </p>
                                <img src={typicalNFTcreation} id="typicalNFTcreation" alt=""/>
                                {/*<h3 id="worstCaseHeader">The Worst Case.</h3>
                                <p className="aboutP">
                                    &emsp;&emsp;A worst case scenario which attempts to illustrate the inefficiencies of the format shown above is as follows. 
                                    Alice and Bob have a relation with one another in that they both participate in "Content DAO" a well know organization which recognizes content created for distribution 
                                    on blockchains. It has been known Alice and a group of creators including Bob have been creating parallel content 
                                    (content with similar narrative/timeline including different camera perspectives such as vlogs). 
                                    Alice has finished the final cut of her content and intends to share it as an NFT represented on the blockchain. 
                                    Bob knows Alice is great at editing and wants to claim the content as his own. Bob knows that "Content DAO" has potential reason to believe he is the distributor 
                                    of the content as he is featured within it. Alice creates her NFT contract with the token URI pointer to the final cut of her content ready to distribute for interaction
                                    by her followers. Bob has been waiting for allice's address to create a transaction with the token URI relating to the content he wants credit for creating. 
                                    Bob front runs allices NFT contract with one of his own including the token URI. Alice doesn't realize Bob has created a NFT contract pointing to her content and released
                                    it on IPFS. Now that the content is in the public sphere Bob contacts "Content DAO" notifying them that the contract Alice has created is pointing to Bob's content 
                                    and to not recognize Alice's NFT on their webpage. "Content DAO" looking at the blockchain for NFT creation time and its content wrongfully associates the content to Bob 
                                    and removes Alice's NFT from view on their page in favor of Bobs' NFT.
                                </p>*/}
                                </div>
                            <h2>The Ratio NFT Protocol.</h2>
                            <div id="nftProtocol">
                                <p className="aboutP" >
                                    &emsp;&emsp;The basis of the Ratio NFT protocol is that it enables content to have a relation to a contract on the blockchain before the content has been distributed. 
                                    This feature ensures that the initial distributor is recognized due to the fact that the attempt to front run the content on-chain or claim it as ones own due to loose ownership is mitigated by the direct distributor relation in the content itself. 
                                    When the URI of a Ratio NFT is posted to the blockchin it is no longer viable to for a bad actor to attempt to front run the content with the given URI as the content of the URI contains the distributors signature refering to the contract with the verifiable distributor address which represents its initial ownership. 
                                    This ensures that the first instance of the URI on the blockchain where the contract address and distributor address are represented within the content itself is rightful distributor of the content.<Popup className="aboutP" flowing content ='Baring that the content being distributed has not previously entered the public sphere.' trigger={<span>* </span>} />
                                    Due to this property, automation of content distributor recoginition is more reliable and enables easier dispute resolution.
                                </p>
                                
                                    <p className="aboutP" id="nftExample">
                                        Ratio NFT asset JSON example,
                                        <br/>
                                        CID: QmRvSCxzL5xAgjUAt9X9xeHuLmsKZjdMvLMoFPm7s75YQu
                                        <br/>
                                        CryptoMonkeyRatioNFT.json
                                        <TextArea id="cryptoMonkeyRatioNFT">{JSON.stringify(CryptoMonkeyRatioNFT, null, 4)}</TextArea>
                                        <h3 >How It Works.</h3>
                                    </p>
                            </div>
                            <img id="nftProtocolDiagram" src={nftProtocolDiagram} alt=""/>
                </Container>
            </div>
        );
    }
}

export default NFT_About;
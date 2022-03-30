// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "./ProtocolNFT.sol";

contract RatioNFT is ERC721Enumerable, Ownable{

    using Counters for Counters.Counter;

    string public baseURI;

    string[] public subURI;

    uint maxSupply;

    uint mintValue;

    Counters.Counter private tokenIds;

    constructor(string memory _name, string memory _symbol, uint _supply, uint _mintValue)payable ERC721(_name, _symbol){
        maxSupply = _supply;
        mintValue = _mintValue;
    }

    function setBaseURI(string memory _uri, bool _ratioProtocol, address _protocolAddress)public  payable onlyOwner{
        baseURI = _uri;
        if(_ratioProtocol){
            ProtocolNFT(_protocolAddress).requestVerification{value: msg.value}(_uri);
        }
    }

    function _baseURI() internal override view returns (string memory){
         return baseURI;
     }

    function mint(address _receiver) public payable returns(uint _id){
        require(msg.value >= mintValue, "Invalid mint value given.");
        require(tokenIds.current() < maxSupply, "Minting has finished.");
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }
}


// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "./NFTProtocol.sol";

contract BadSingleNFT is ERC721Enumerable{

    using Counters for Counters.Counter;

    // Distributor.
    address public distributor;

    // URI Variables.
    string public baseURI;

    string public image;

    string public audio;

    string public video;

    string public model;

    // NFT creation variables.
    uint public maxSupply;

    uint public mintValue;

    Counters.Counter private tokenIds;

    modifier onlyDistributor(){
        require(distributor == msg.sender, "Invalid distributor address.");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint _supply, uint _mintValue)payable ERC721(_name, _symbol){
        distributor = msg.sender;
        maxSupply = _supply;
        mintValue = _mintValue;
    }

    function _baseURI() internal override view returns (string memory){
         return baseURI;
    }

    // Bad function setting distributor post construtor
    function setDistributor(address _distributor) public onlyDistributor{
        distributor = _distributor;
    }

    // Bad function allows for changing baseURI.
    function setBaseURI(string memory _uri, bool _ratioProtocol, address _protocolAddress)public  payable onlyDistributor{
        baseURI = _uri;
        if(_ratioProtocol){
            NFTProtocol(_protocolAddress).requestVerification{value: msg.value}();
        }
    }

    function setSubURIs(string memory _image, string memory _audio, string memory _video, string memory _model) public onlyDistributor{
        image = _image;
        audio = _audio;
        video = _video;
        model = _model;
    }

    function mint(address _receiver) public payable returns(uint _id){
        require(msg.value >= mintValue, "Invalid mint value given.");
        require(tokenIds.current() < maxSupply, "Minting has finished.");
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }

}
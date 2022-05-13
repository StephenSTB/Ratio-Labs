// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "./NFTProtocol.sol";

contract RatioSingleNFT is ERC721Enumerable{

    using Counters for Counters.Counter;

    // Distributor.
    address public immutable distributor;

    // NFT creation variables.
    uint public immutable maxSupply;

    uint public immutable mintValue;

    // URI Variables.
    string public baseURI;

    string public cid;

    string public image;

    string public audio;

    string public video;

    string public model;

    // URI limiters
    bool baseURIset = false;

    bool subURIset = false;

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

    function setBaseURI(string memory _uri, bool _ratioProtocol, address _protocolAddress)public  payable onlyDistributor{
        require(baseURIset == false, "Base URI has already been set.");
        baseURI = _uri;
        if(_ratioProtocol){
            NFTProtocol(_protocolAddress).requestVerification{value: msg.value}();
        }
        baseURIset = true;
    }

    function setSubURIs(string memory _image, string memory _audio, string memory _video, string memory _model) public onlyDistributor{
        require(baseURIset == true, "Base URI has not been set.");
        require(subURIset == false, "Sub URIs have already been set.");
        image = _image;
        audio = _audio;
        video = _video;
        model = _model;
        subURIset = true;
    }

    function info() public view returns( string memory _name, string memory _image, string memory _audio, string memory _video, string memory _model, uint _maxSupply, uint _mintValue, uint _minted){
        return (name(), image, audio, video, model, maxSupply, mintValue, tokenIds.current());
    }

    function mint(address _receiver) external virtual payable returns(uint _id){
        require(msg.value >= mintValue, "Invalid mint value given.");
        require(baseURIset, "NFT is not initialized.");
        require(subURIset, "NFT is not initialized.");
        require(tokenIds.current() < maxSupply, "Minting has finished.");
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }

}


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

    uint public immutable claimValue;

    uint public immutable burnValue;

    bool public immutable burnable;

    uint public unclaimed;

    // URI Variables.
    string public baseURI;

    string public image;

    string public audio;

    string public video;

    string public model;

    // URI limiters
    bool baseURIset = false;

    bool subURIset = false;

    Counters.Counter private tokenIds;

    struct infoStruct{
        address _distributor;
        string _name; 
        string _base;
        string _image;
        string _audio;
        string _video; 
        string _model; 
        uint _mintValue;
        uint _maxSupply; 
        uint _minted;
        uint _claimValue;
        uint _unclaimed;
        bool _burnable; 
        uint _burnValue;
    }

    modifier onlyDistributor(){
        require(distributor == msg.sender, "Invalid distributor address.");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint _supply, uint _mintValue, uint _claimValue, bool _burnable)payable ERC721(_name, _symbol){
        require(_claimValue <= _mintValue);
        distributor = msg.sender;
        maxSupply = _supply;
        mintValue = _mintValue;
        claimValue = _claimValue;
        burnable = _burnable;
        burnValue = _mintValue - _claimValue;
    }

    function _baseURI() internal override view returns (string memory){
         return baseURI;
    }

    function tokenURI(uint tokenId) public override view returns(string memory){
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _baseURI();
    }

    function setBaseURI(string memory _uri, bool _ratioProtocol, address _protocolAddress) public payable onlyDistributor{
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

    function claim() public onlyDistributor{
        uint _claim = unclaimed * claimValue;
        delete unclaimed;
        payable(distributor).transfer(_claim);
    }

    function info() public view returns(infoStruct memory _info){
        return infoStruct(distributor, name(), baseURI, image, audio, video, model, mintValue, maxSupply, tokenIds.current(), claimValue, unclaimed, burnable, burnValue);
    }

    function mint(address _receiver) external virtual payable returns(uint _id){
        require(msg.value >= mintValue, "Invalid mint value given.");
        require(baseURIset, "NFT is not initialized.");
        require(subURIset, "NFT is not initialized.");
        require(tokenIds.current() < maxSupply, "Minting has finished.");
        unclaimed++;
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }

    function burn(uint _tokenId) external virtual {
        require(burnable, "This NFT is not burnable.");
        require(ownerOf(_tokenId) == msg.sender);
        _burn(_tokenId);
        payable(msg.sender).transfer(burnValue);
    }
}


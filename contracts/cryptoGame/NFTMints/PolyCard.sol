// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "../WrappedTokens/WMatic.sol";

import "../Interfaces/Mintable.sol";

contract PolyCard is ERC721URIStorage, ERC721Enumerable, Mintable, Ownable{

    WMatic wMatic;

    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    string public URI;

    constructor(address _wMatic, string memory _uri, string memory _name, string memory _symbol )ERC721(_name, _symbol){
        wMatic = WMatic(_wMatic);
        URI = _uri;
    }

    function mint(address _receiver) external override onlyOwner returns(uint _id){
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
        _setTokenURI(_id, URI);
    }

    function burn(uint _tokenId) external override onlyOwner{
        _burn(_tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public{
        require(msg.sender == ownerOf(tokenId));
        _setTokenURI(tokenId, _tokenURI);
    }

     function _baseURI() internal override pure returns (string memory){
         return "ipfs://";
     }

    function _burn(uint _tokenId) internal override(ERC721, ERC721URIStorage){
        super._burn(_tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint tokenId) internal override(ERC721, ERC721Enumerable){
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns(bool){
        return super.supportsInterface(interfaceId);
    }

     function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory){
        return super.tokenURI(tokenId);
    }
}
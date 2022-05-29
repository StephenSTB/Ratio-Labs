pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "../WrappedTokens/WBNB.sol";

import "../Interfaces/Mintable.sol";

contract BNBCard is ERC721URIStorage, ERC721Enumerable, Mintable, Ownable{

    WBNB wBnb;

    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    constructor(address _wbnb)ERC721("BNBCard", "BC"){
        wBnb = WBNB(_wbnb);
    }

    function mint(address _receiver) external override payable onlyOwner returns(uint _id){
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }

    function burn(uint _tokenId) external override onlyOwner{
        _burn(_tokenId);
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
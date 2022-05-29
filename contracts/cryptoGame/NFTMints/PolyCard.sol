// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../Interfaces/Mintable.sol";

import "../../NFTProtocol/RatioSingleNFT.sol";

contract PolyCard is RatioSingleNFT, Mintable, Ownable{

    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    uint256 MAX_INT = 2**256 - 1;

    constructor(string memory _name, string memory _symbol )RatioSingleNFT(_name, _symbol, MAX_INT, 0, 0, true){
        
    }

    function mint(address _receiver) external override(RatioSingleNFT, Mintable) payable onlyOwner returns(uint _id){
        tokenIds.increment();
        _id = tokenIds.current();
        _safeMint(_receiver, _id);
    }

    function burn(uint _tokenId) external override(RatioSingleNFT, Mintable) onlyOwner{
        _burn(_tokenId);
    }
}
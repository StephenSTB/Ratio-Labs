// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.5;

import "../../NFTProtocol/RatioSingleNFT.sol";

contract CryptoMonkey is RatioSingleNFT{

    uint public immutable id;

    constructor(string memory _name, string memory _symbol, uint _id, address _reciever)RatioSingleNFT(_name, _symbol, 1, 0, 0, false){
        id = _id;
        _safeMint(_reciever, _id);
    }
    
}
pragma solidity ^0.8.2;

interface Mintable{

    function mint(address _receiver) external payable returns(uint _id);

    function burn(uint _tokenId) external;
}
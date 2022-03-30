pragma solidity ^0.8.2;

contract BlockMiner{

    uint mined;
    constructor(){
        mined = 0;
    }

    function mine() public {
        mined++;
    }
}
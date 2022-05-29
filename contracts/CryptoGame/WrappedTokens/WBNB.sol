pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WBNB is ERC20{
    constructor(uint _amount)ERC20("Wrapped BNB", "WBNB"){

        _mint(msg.sender, _amount);

    }
}
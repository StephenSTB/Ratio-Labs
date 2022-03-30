pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WMatic is ERC20{
    constructor(uint _amount)ERC20("Wrapped Matic", "WMatic"){

        _mint(msg.sender, _amount);

    }
}
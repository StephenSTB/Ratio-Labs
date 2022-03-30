pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract CryptoGame is ERC20, Ownable{
    constructor()ERC20("CryptoGame", "CG")
    {

    }

    function mint(address _to, uint _amount) public onlyOwner{
        _mint(_to, _amount);
    }

}
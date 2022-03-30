pragma solidity ^0.8.0;

import "../Ratio.sol";

import "./Profile.sol";

contract Profiles{

    // Ratio
    Ratio ratio;

    uint profileCost;

    mapping(address => Profile) public ProfileMap;

    constructor(address _ratio)
    {
        ratio = Ratio(_ratio);
    }

    function create() public payable{
        require(msg.value > profileCost);

    }

    function show(address _owner) public view returns(address _profile){
        return address(ProfileMap[_owner]);
    }

}
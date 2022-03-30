pragma solidity ^0.8.0;

import "../Ratio.sol";

// Contract to define a profile. (Profiles are NFT's used to identify ratio participants and perform actions in governance.)
contract Profile{

    // Ratio contract.
    Ratio ratio;

    // owner of the profile.
    address public owner;

    // name.
    string public name;

    // description
    string description;

    // nfts owned by profile
    address[] NFTs;

    // voting weight of the profile.
    uint weight;

    constructor(address _ratio, address _owner, string memory _name, string memory _description){
        owner = _owner;
        name = _name;
        description = _description;
        ratio = Ratio(_ratio);
    }

}
pragma solidity ^0.8.0;

import "../Ratio.sol";

import "../interfaces/IGoverned.sol";

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";


// Contract to aid in adherance to the Ratio governance protocol.
contract Governed is IGoverned, ERC165Storage{

    // Ratio contract.
    Ratio public ratio;

    // name of the contract.
    string public name;

    // allocation given to the contract.
    uint public allocation;

    // coin distribution duration given to the contract.
    uint public duration;

    // approval rating given to the contract.
    uint public approval;

    // removal rating given to the contract.
    uint public removal;

    // the epoch that the governed contract was proposed.
    uint public epoch;

    // modifier to determine if sender is the ratio contract.
    modifier isRatio{
        require(msg.sender == address(ratio), "Must be called by ratio.");
        _;
    }

    /* Gonverned Constructor
    * @params
    *
    */
    constructor(address _ratio, string memory _name, uint _allocation, uint _duration){
        _registerInterface(type(IERC165).interfaceId);
        _registerInterface(type(IGoverned).interfaceId);
        ratio = Ratio(_ratio);
        name = _name;
        allocation = _allocation;
        duration = _duration;
    }

    // Calls the ratio mint function on behalf of the governed contract.
    function mint(address _reciever, uint _amount) internal{
        ratio.mint(_reciever, _amount);
    }

    // Sets the allocation of the governed contract.
    function setAllocation(uint _allocation) external override isRatio{
        allocation  = _allocation;
    }
    
    // Sets the aproval threshold of the contract.
    function setApproval(uint _approval) external override isRatio{
        approval = _approval;
    }

    // Set the removal threshold of the contract.
    function setRemoval(uint _removal) external override isRatio{
        removal = _removal;
    }

    // Sets the epoch upon proposal.
    function setEpoch(uint _epoch) external override isRatio{
        epoch = _epoch;
    }

    // Set the coin distribution duration.
    function setDuration(uint _duration) external override isRatio{
        duration = _duration;
    }

}
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// Interface to handle Governed contract adherence.
interface IGoverned is IERC165{
    /* 
     *   Functions for Governed Contracts.
     */

    // Sets the allocation of the governed contract.
    function setAllocation(uint _alloction) external;

    // Sets the aproval threshold of the contract.
    function setApproval(uint _approval) external;

    // Set the removal threshold of the contract.
    function setRemoval(uint _removal) external;

    // Set the initial epoch of the the contract.
    function setEpoch(uint _epoch) external;

    // Set the coin distribution duration.
    function setDuration(uint _duration) external;

}
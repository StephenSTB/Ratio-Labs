pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// Interface to handle Proposal contract adherence.
interface IProposal is IERC165{

    // Enum to represnt voting options.
    enum Vote{
        yes,
        no,
        abstain
    }

    /* 
     *   Functions for Proposal Contracts.
     */

    // Votes on the Proposal.
    function vote(Vote _vote, uint _weight) external;

    // Sets the approved variable.
    function setApproved(bool _approved) external;

    // Sets the governed contract array.
    function setGoverned(address[] memory _governed) external;

    // Return the goverend contract array length.
    function governedLength() external view returns(uint _length);


    
}
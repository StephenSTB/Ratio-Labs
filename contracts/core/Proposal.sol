pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import "../interfaces/IProposal.sol";

import "../interfaces/IGoverned.sol";

// Contract to handle the approval or removal of Governed contracts.
contract Proposal is IProposal, ERC165Storage{

    // Ratio contract.
    address public ratio;

    // Epoch closing voting.
    uint public epoch;

    // Name of the Proposal.
    string public name;

    // Addresses of the Governed contracts proposed to be approved or removed.
    address[] public governed;

    // Description of the contracts to be added or why contracts should be removed.
    string public description;

    // Variable to represent if the Proposal was approved / executed.
    bool public approved;

    // Address of the sender who created the Proposal.
    address public proposer;

    // Varialbe to determine if voting is open.
    bool public open;

    mapping(Vote => uint) public votes;

     // modifier to determine if sender is the ratio contract.
    modifier isRatio{
        require(msg.sender == ratio, "Must be called by ratio.");
        _;
    }

    constructor(address _ratio, uint _epoch, string memory _name, string memory _description, address[] memory _governed){
        _registerInterface(type(IERC165).interfaceId);
        _registerInterface(type(IProposal).interfaceId);
        ratio = _ratio;
        epoch = _epoch;
        name = _name;
        governed = _governed;
        description = _description;
        proposer = msg.sender;

    }

    // Votes on the Proposal.
    function vote(Vote _vote, uint _weight) external override isRatio{
        require(open, "Voting for this proposal has closed.");
        votes[_vote] += _weight;
    }

    //  Sets the Approved variable.
    function setApproved(bool _approved) external override isRatio{
        approved = _approved;
    }

    // Sets the governed contracts array.
    function setGoverned(address[] memory _governed) external override isRatio{
        governed = _governed;
    }

    // Returns the length of the governed array.
    function governedLength() external override view returns(uint _length){
        return governed.length;
    }
    
}
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import "./core/Profiles.sol";

import "./core/Governed.sol";

import "./core/Proposal.sol";

import "./interfaces/IGoverned.sol";

import "./interfaces/IProposal.sol";

// Ratio DAO contract to distribute governance tokens to smart contracts.
contract Ratio is ERC20{

    /*
     * Core Contracts.
     */

    // Profiles of Ratio.
    Profiles profiles;

    /* 
     * Core Variables.
     */
    
    // The current ratio governance epoch.
    uint public epoch;

    // The block which starts the current epoch.
    uint public epochBlock;

    // The number of blocks that make up an epoch.
    uint public epochDuration;

    // The amount of ether required to make a proposal.
    uint public proposalCost;

    // Thresholds to determine what allocations should have what approval threshold.
    uint[] public allocationThresholds; 

    // Thresholds to determine amount of positive voting needed to pass the proposal. (positiveVoting = (aproveVotingPower - disaproveVotingPower) * divisionConstant / totalVotingPower)
    uint[] public approvalThresholds;

    // Thresholds to determine amount of negative voting needed to remove the proposal. Inverse of above.
    uint[] public removalThresholds;

    // Maximum allocation a contract can be given.
    uint maxAllocation;

    // Minimum allocation a contract can be given.
    uint minAllocation;

    /* 
     * Governed contract variables.
     */

    // mapping to determine if the address is governed
    mapping(address => bool) public GovernedContracts;

    // array of the governed contracts
    address[] GovernedContractsArray;

    mapping(string => address) public findGovernedContract;

    // Proposal contract variables.
    mapping(address => Proposal) public Proposals;

    // Max int declaration for core governed contracts.    
    uint256 MAX_INT = 2**256 - 1;

    // Event emited when an aprove proposal is created.
    event ApproveProposal(address _proposal);

    // Event emited when a new epoch begins.
    event Epoch(uint _epoch, uint _block);

    modifier isGoverned{
        require(GovernedContracts[msg.sender]||  msg.sender == address(profiles), "Only a governed contract can call this function.");
        _;
    }

    constructor(uint[] memory _allocationThresholds, uint[] memory _approvalThresholds, uint[] memory _removalThresholds)ERC20("Ratio", "RATIO"){
        // Initialize Profiles contract.
        profiles = new Profiles(address(this));

        epoch = 0;
        epochBlock = block.number;
        epochDuration = 1_000_000_000;

        allocationThresholds = _allocationThresholds;
        approvalThresholds = _approvalThresholds;
        removalThresholds = _removalThresholds;

        maxAllocation = 1_000_000_000 * (10 ** 18);

        proposalCost = 10 ** 17;
    }

    // Core Functions
    function mint(address _reciever, uint _amount) isGoverned external {
        // instantiate a the governed contract to 
        require(Governed(msg.sender).allocation() >= _amount, "Contract not allocated enough to mint amount given.");
        require(Governed(msg.sender).duration() >= block.number);
        Governed(msg.sender).setAllocation(Governed(msg.sender).allocation() - _amount);
        _mint(_reciever, _amount);
    }

    function approveProposal(string memory _name, string memory _description, address[] memory _governed) public payable{
        // Determine Proposal Requirements Pass
        require(msg.value >= proposalCost, "Insufficent proposal cost submitted.");

        uint maxApproval = 0;
        // Loop to Set governance variables.
        for(uint i = 0; i < _governed.length; i++){

            require(GovernedContracts[_governed[i]] == false, "Proposal contains an already governed contract.");
            require(ERC165Checker.supportsInterface(_governed[i], type(IGoverned).interfaceId));

            Governed governed = Governed(_governed[i]);
            require(address(governed.ratio()) == address(this), "Ratio address is incorrect.");
            require(findGovernedContract[governed.name()] == address(0), "Contract name taken.");
            require(governed.allocation() <= maxAllocation && governed.allocation() >= minAllocation, "Governed contract allocation out of range.");
            require(governed.approval() == 0, "Governed approval variable not zero.");
            require(governed.removal() == 0, "Governed removal variable not zero.");

            
            for(uint j = 0; j < allocationThresholds.length; j){
                if(governed.allocation() <= allocationThresholds[j]){
                    governed.setApproval(approvalThresholds[j]);
                    governed.setRemoval(removalThresholds[j]);
                    governed.setEpoch(epoch);
                    maxApproval = maxApproval < allocationThresholds[j] ? allocationThresholds[j] : maxApproval;
                    break;
                }
            }
        }
        
        if(maxApproval == 0){
            return;
        }

        Proposal proposal = new Proposal(address(this), epoch + 1, _name, _description, _governed);

        emit ApproveProposal(address(proposal));
    }
    /*
    function removeProposal(string memory _name, string memory _description, address[] memory _governed) public payable returns(address _proposal){
        return address(0);
    }

    function executeProposal(address _proposal) public returns (bool _executed){
        return false;
    }
    */

    function incrementEpoch() public{
        require(block.number >= (epochBlock + epochDuration));
        epochBlock += epochDuration;
        epoch++;
        emit Epoch(epoch, epochBlock);
    }


    function vote(address _proposal) external {

    }
}
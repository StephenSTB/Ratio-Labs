pragma solidity ^0.8.2;

import "@openzeppelin/contracts/governance/Governor.sol";

import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";

import "@openzeppelin/contracts/governance/compatibility/GovernorCompatibilityBravo.sol";

contract MockGovernor is Governor, GovernorVotes, GovernorVotesQuorumFraction, GovernorCountingSimple{
    
    constructor(ERC20Votes _token) Governor("MockGovernor") GovernorVotes(_token) GovernorVotesQuorumFraction(4){

    }

    function votingDelay() public pure override returns(uint){
        return 6575;
    }

    function votingPeriod() public pure override returns(uint){
        return 46027;
    }


}
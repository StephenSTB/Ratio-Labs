// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.5;

contract Oracle{

    uint public epoch;
    uint public slot;
    uint public transition;

    struct validator{
        mapping(address => uint) token;
        mapping(address => uint) stake;
    }

    mapping(address => validator) validatorMap;

    address[] public validators;

    address[] public contracts;

    

    constructor(){

    }

    function submit(address _contract, bytes[] calldata _payload) external{
        // appropriate validator data;

    }

     /**
     * @dev Internal execution mechanism. Can be overridden to implement different execution mechanism
     */
     /*
    function _execute(
        uint256, /* proposalId *//*
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*//*
    ) internal virtual {
        string memory errorMessage = "Governor: call reverted without message";
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            Address.verifyCallResult(success, returndata, errorMessage);
        }
    }*/


}
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../NFTProtocol/NFTProtocol.sol";

import "./CryptoMonkey.sol";

import "vrf-solidity/contracts/VRF.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

contract CryptoMonkeys is Ownable{

    using Counters for Counters.Counter;

    event mintRequest(address _minter, uint _id);

    Counters.Counter private tokenIds;

    uint public immutable mintCost;

    IERC20 public CryptoGame;

    NFTProtocol nftProtocol;

    mapping(uint => address) monkeys;

    constructor(IERC20 _CryptoGame, NFTProtocol _nftProtocol,  uint _mintCost){
        mintCost = _mintCost;
        CryptoGame = _CryptoGame;
        nftProtocol = _nftProtocol;
    }

    function mint(address _receiver) external payable returns(uint _id){
        require(CryptoGame.allowance(msg.sender, address(this)) >= mintCost, "Invalid Crypto Game Token Allowance.");
        require(msg.value >= nftProtocol.getMinimumRequestValue(), "Invalid Request Value Given.");
        CryptoGame.transferFrom(msg.sender, address(this), mintCost);

        tokenIds.increment();
        _id = tokenIds.current();

        emit mintRequest(_receiver, _id);
    }

    function mapMonkeys(address[] memory _monkeys) external onlyOwner{
        for(uint i = 0 ; i < _monkeys.length; i++){
            monkeys[CryptoMonkey(_monkeys[i]).id()] = monkeys[i];
        }
    }
    
    function functionUsingVRF(
    uint256[2] memory  _publicKey,
    uint256[4] memory  _proof,
    bytes memory _message)
    public pure returns (bool)
    {
        return VRF.verify(_publicKey, _proof, _message);
    }

    function decodeProof(bytes memory _proof) external pure returns(uint[4] memory _decodedProof){
        return VRF.decodeProof(_proof);
    }

}
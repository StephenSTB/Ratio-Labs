pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Interfaces/Mintable.sol";

import "./NFTChef.sol";

// Creates NFT stakes for participants 
contract NFTMinter is Ownable{
    using SafeERC20 for IERC20;

    // struct to hold information about nfts which receive rewards from NFTChef
    struct nftInfo{
        IERC20 token;
        uint stake;
        uint duration;
        uint pid;
    }

    // mapping holding the starting stake block of nfts tokenIds
    mapping(address => mapping(uint => uint)) public starts;

    // Contract of the NFTChef.
    NFTChef nftChef;

    // mapping of the nfts nftInfo.
    mapping(address => nftInfo) public nfts;

    // event emitted when an nft is minted 
    event NFT_Mint(address _nft, uint _id);

    // Constructor
    constructor(address _nftChef){
        nftChef = NFTChef(_nftChef);
    }

    // Function to add the nft type to the NFTMinter/NFTChef contracts.
    function add(IERC721 _nft, IERC20 _token, uint _stake, uint _duration, uint _allocPoint) public onlyOwner{
        nftChef.add(_allocPoint, _nft, _token, true);

        nfts[address(_nft)] = nftInfo(_token, _stake, _duration, nftChef.poolLength() - 1);
    }

    //Fuunction to set nft allocPoints in nftChef
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner
    {
        nftChef.set(_pid, _allocPoint, _withUpdate);
    }

    // Function to mint an _nft
    function mint(Mintable _nft) public{
        // Condition to determine if the nft to be minted exists.
        require(address(nfts[address(_nft)].token) != address(0), "Invalid nft to mint");

        // Get the info about the given nft for minting.
        nftInfo memory info = nfts[address(_nft)];

        // Condition to determine if the sender has aproved collateral for nft mint.
        require(info.token.allowance(msg.sender, address(nftChef)) >= info.stake, "Invalid stake given for the nft mint");

        // Mint NFT and store id for pool use.
        uint id = _nft.mint(msg.sender);

        starts[address(_nft)][id] = block.number;

        // Mint and emit id
        emit NFT_Mint(address(_nft), id);

        //deposit stake into NFTChef.
        nftChef.deposit(msg.sender, info.pid, id, info.stake);
        
    }

    // Function to harvest CryptoGame tokens on the behalf of the _nft with _id
    function harvest(IERC721 _nft, uint _id) public{
        // Condition to determine if the nft to be harvested exists.
        require(address(nfts[address(_nft)].token) != address(0), "Can not harvest NFT address.");
        // Condition to determine if the sender is the owner of _nft with _id 
        require(_nft.ownerOf(_id) == msg.sender, "Sender is not the owner of the token.");

        // Condition to harvest _nft with _id to sender.
        nftChef.harvest(msg.sender, nfts[address(_nft)].pid, _id);
    }

    // Function to burn _nft and receive stake.
    function burn(Mintable _nft, uint _id) public{
        // Condition to determine if the nft to be burned exists.
        require(address(nfts[address(_nft)].token) != address(0), "Invalid nft to burn");

        // Condition to determine if the sender is the owner of the _nft with _id
        require(msg.sender == IERC721(address(_nft)).ownerOf(_id), "Sender is not the owner of the token.");

        // Condition to determine if the stake duration has expired.
        require(block.number > starts[address(_nft)][_id] + nfts[address(_nft)].duration, "The nft can not be burned yet.");

        // Remove nft and stake from the pool.
        nftChef.withdraw(msg.sender, nfts[address(_nft)].pid, _id,nfts[address(_nft)].stake);

        // Burn the _nft with _id.
        _nft.burn(_id);
    }
}
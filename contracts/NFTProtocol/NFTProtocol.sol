// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./RatioSingleNFT.sol";

import "@openzeppelin/contracts/utils/Address.sol";

// Contract to verify nft contracts.
contract NFTProtocol is Ownable {

    // Minimum amount to be paid for verificaiton/hosting.
    uint public minimumRequestValue;

    // Mapping to determine valid NFTs of contract.
    mapping(address => nftStruct) contractNFT;

    // Mapping to determine contract of a baseURI;
    mapping(string => address) public baseURIContract;

    // Mapping to determine contract of a subURI;
    mapping(string => address) public subURIContract;

    // Mapping to determine all contracts verified at one time to a distributor. 
    // WARNING! array may contain contracts containing subURIs not distributed by distributor. 
    // contractNFT will determine if the distributor is the rightful distributor of the NFT!
    mapping(address => address[]) public distributorContracts; 

    // Array to hold all nfts contracts verified at one time.
    // WARNING! array may contain contracts no longer verified.
    address[] public nftContracts;

    // mapping to hold contracts that have requested verification.
    mapping(address => bool) nftRequest;

    // Mapping to hold nft leafs that have been verified.
    mapping(bytes32 => bool) nftVerified;

    // Structure to hold NFT data.
    struct nftStruct{
        address _contract;
        address _distributor;
        string _baseURI;
        string[] _subURIs;
        uint _block;
    }

    // Structure to hold nftBlock variables.
    struct nftBlock{
        bytes32 _prev;
        bytes32 _root;
        bytes32[] _leaves;
        uint _block;
    }

    // NFT blockchain...
    nftBlock[] public nftBlocks;

    // Mapping of block roots to blocks.
    mapping(bytes32 => nftBlock) public blockMap;

    // Event emitted when a new nft block is submitted.
    event blockSubmited(nftBlock _block);

    // Event emitted when a verification request is submitted.
    event verificationRequest(address _contract, address _distributor, string _baseURI, uint _block);

    // Event emitted when an nft has been verifed!
    event verified(nftStruct _nft);

    // Event emitted when nfts have been slashed.
    event slashed(address[] _contracts);

    // Constructor
    constructor(uint _minimumRequestValue){
        minimumRequestValue = _minimumRequestValue;
        nftBlock memory n = nftBlock(bytes32(0), bytes32(0) , new bytes32[](0), block.number);
        nftBlocks.push(n);
    }
    
    // Function to requets verificaition of NFT 
    function requestVerification() public payable{

        // Creating RatioSingleNFT contract from requester.
        RatioSingleNFT ratioNFT = RatioSingleNFT(msg.sender);

        // Contract specification conditions.
        require(msg.value >= minimumRequestValue, "Invalid Request .");

        require(Address.isContract(msg.sender), "Sender must be a contract");
        
        require(nftRequest[msg.sender] == false, "NFT contract already requested verification.");

        require(baseURIContract[ratioNFT.baseURI()] == address(0), "Base URI has already been claimed.");

        require(bytes(ratioNFT.baseURI()).length == 53, "Incorrect _baseURI length");

        require(uriPrefix(ratioNFT.baseURI()), "Incorrect prefix in _baseURI");

        nftRequest[msg.sender] = true;

        // Emit verificationRequest event for Oracle.
        emit verificationRequest(msg.sender, ratioNFT.distributor() , ratioNFT.baseURI(), block.number);
    }

    // Function to verify a nft of behalf of Ratio Labs.
    function verifyNFT(bytes32[] memory _proof, bytes32 _root, bytes32 _leaf, nftStruct memory _nft) public{
        // require the _root to exist.
        require(blockMap[_root]._block != 0, "Invalid nft root given.");

        // calculate sub URI encoding.
        bytes memory encoded;
        for (uint i = 0; i < _nft._subURIs.length; i++) {
            encoded = bytes.concat(
                encoded,
                abi.encodePacked(_nft._subURIs[i])
            );
        }

        // require _leaf hash to match _nft hash.
        require(_leaf == keccak256(abi.encodePacked(_nft._contract, _nft._distributor, _nft._baseURI, encoded, _nft._block)), "Given _leaf does not match _nft.");
        // require _nft is not already verified.
        require(!nftVerified[_leaf], "NFT was already verified.");
        // require _nft is within _root .
        require(MerkleProof.verify(_proof, _root, _leaf), "Invalid Proof");

        // Verify and Store NFT info.
        nftVerified[_leaf] = true;

        // Set subURIs contract. 
        for(uint i = 0; i < _nft._subURIs.length; i++){
            if(subURIContract[_nft._subURIs[i]] != address(0)){
                require(contractNFT[subURIContract[_nft._subURIs[i]]]._block == 0 || 
                        contractNFT[subURIContract[_nft._subURIs[i]]]._block > _nft._block, "Invalid block height for subURI.");
            }
            subURIContract[_nft._subURIs[i]] = _nft._contract;
        }

        // Set contracts NFT;
        contractNFT[_nft._contract] = _nft;

        // Push nft contract address into nftContracts array.
        nftContracts.push(_nft._contract);

        // Push contract address into distributor distributorContracts.
        distributorContracts[_nft._distributor].push(_nft._contract);

        // Set baseURI contract.
        baseURIContract[_nft._baseURI] = _nft._contract;  
        
        // Emit verified event.
        emit verified(_nft);
    }

    // Function to submit nft blocks for verified NFTs.
    function submitBlock(nftBlock memory _block) public onlyOwner{
        require(_block._block == 0, "Invalid _block initialization.");
        _block._block = block.number;
        nftBlocks.push(_block);
        blockMap[_block._root] = nftBlocks[nftBlocks.length-1];
        emit blockSubmited(_block);
    }

    // Function to _slashNFTs via Oracle
    function slashNFTs(address[] memory _contracts) public onlyOwner{
        for(uint i = 0; i < _contracts.length; i++){
            delete contractNFT[_contracts[i]];
        }
        emit slashed(_contracts);
    }

    // Function to slashNFT via public
    function slashNFT(address _contract) public{
        require(contractNFT[_contract]._contract != address(0), "Contract isn't verified.");
        RatioSingleNFT rNFT = RatioSingleNFT(_contract);
        nftStruct memory nStruct = contractNFT[_contract];
        if(rNFT.distributor() != nStruct._distributor || !compareStrings(rNFT.baseURI(), nStruct._baseURI)){
            delete contractNFT[_contract];
        }
    }

    /**  
    *** User Helper Functions
    **/
    
    // Function to return latestBlock
    function latestBlock() public view returns(nftBlock memory _block){
        return nftBlocks[nftBlocks.length - 1];
    }

    function getContractNFT(address _contract) public view returns(nftStruct memory _nft){
        return contractNFT[_contract];
    }

    function getBaseURIdistributor(string memory _baseURI) public view returns(address _distributor){
        return contractNFT[baseURIContract[_baseURI]]._distributor;
    }

    function getSubURIbaseURI(string memory _subURI) public view returns(string memory _baseURI){
        return contractNFT[subURIContract[_subURI]]._baseURI;
    }

    function getDistributorContracts(address _distributor) public view returns(address[] memory _contracts){
        return distributorContracts[_distributor];
    }

    /**  
    *** Contract Helper Functions
    **/

    function uriPrefix(string memory _baseURI) internal pure returns(bool){
        return  keccak256( abi.encodePacked( bytes9( bytes(_baseURI) ) ) ) == keccak256( abi.encodePacked( bytes9("ipfs://Qm") ) ) ;
    }

    function compareStrings(string memory _a, string memory _b) internal pure returns(bool){
        return keccak256( abi.encodePacked( bytes(_a) ) )  == keccak256( abi.encodePacked( bytes(_b) ) );
    }

    /**  
    *** Owner Helper Functions
    **/

    function getContracts(uint _start, uint _end) public view returns(address[1000] memory _contracts){
        uint n = 0;
        for(uint i = _start; i <= _end; i++)
        {
            _contracts[n] = nftContracts[i];
            n++;
        }
    }

    function modifyRequestValue(uint _val) public onlyOwner{
        minimumRequestValue = _val;
    }

    function claim() public{
        payable(owner()).transfer(address(this).balance);
    }
 
}
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./RatioNFT.sol";

// Contract to verify nft distributors.
contract ProtocolNFT is Ownable {

    uint public minimumRequestValue;

    mapping(string => address) uriDistributor;

    mapping(address => mapping(string => nftStruct)) nftDistributor;

    mapping(bytes32 => bool) nftVerified;

    mapping(bytes32 => uint) nftRootsMap;

    bytes32[] nftRoots;

    //bytes public ipfsBytes = bytes("ipfs://");   

    //bytes public uriBytes = bytes("ipfs://QmcLZTfyPJxvmGQUKqpiMtVa2qTmPS2MvEPm4gyTkm6mrZ");

    event rootSubmited(bytes32 _root, uint _block);

    event verificationRequest(address _contract, address _distributor, string _baseURI, uint _block, uint _value);

    event verified(nftStruct _nft);

    /*
    event verifyStruct(address _contract, address _distributor, string _baseURI);

    event verifyLeaf(bytes32 _given, bytes32 _hashed);*/

    event proof(bool _proof);

    // Structure to hold NFT data.
    struct nftStruct{
        address _contract;
        address _distributor;
        string _baseURI;
        string[] _subURIs;
    }

    // Constructor
    constructor(uint _minimumRequestValue){
        minimumRequestValue = _minimumRequestValue;
    }

    // Function to submit transaction roots for verified NFTs.
    function submitRoot(bytes32 _root) public onlyOwner{
        nftRoots.push(_root);
        nftRootsMap[_root] = block.number;
        emit rootSubmited(_root, block.number);
    }
    
    // Function to requets verificaition of NFT 
    function requestVerification(string  memory _baseURI) public payable{
        require(msg.value >= minimumRequestValue, "Invalid Request .");

        require(uriDistributor[_baseURI] == address(0), "Base URI has already been claimed.");

        require(bytes(_baseURI).length == 53, "Incorrect _baseURI length");

        require((keccak256(abi.encodePacked(bytes9( bytes(_baseURI) ) ) )  == keccak256(abi.encodePacked( bytes9("ipfs://Qm") ) ) ), "Incorrect prefix in _baseURI");

        emit verificationRequest(msg.sender, Ownable(msg.sender).owner(), _baseURI, block.number, msg.value);
    }

    // Function to verify a nft of behalf of Ratio Labs.
    function verifyNFT(bytes32[] memory _proof, bytes32 _root, bytes32 _leaf, nftStruct memory _nft) public{
        // require the _root to exist.
        require(nftRootsMap[_root] != 0, "Invalid nft root given.");
        // calculate sub URI encoding.
        bytes memory encoded;
        for (uint i = 0; i < _nft._subURIs.length; i++) {
            encoded = bytes.concat(
                encoded,
                abi.encodePacked(_nft._subURIs[i])
            );
        }
        // require _leaf hash to match _nft hash.
        require(_leaf == keccak256(abi.encodePacked(_nft._contract, _nft._distributor, _nft._baseURI, encoded)), "Given _leaf does not match _nft.");
        // require _nft is not already verified.
        require(!nftVerified[_leaf], "NFT was already verified.");
        // require _nft is within _root .
        require(MerkleProof.verify(_proof, _root, _leaf), "Invalid Proof");

        // Verify and Store NFT info.
        nftVerified[_leaf] = true;
        uriDistributor[_nft._baseURI] = _nft._distributor;
        for(uint i = 0; i < _nft._subURIs.length; i++){
            uriDistributor[_nft._subURIs[i]] = _nft._distributor;
        }
        nftDistributor[_nft._distributor][_nft._baseURI] = _nft;
        emit verified(_nft);
    }

    
    function verifyProofTest(bytes32 _root, bytes32 _leaf, bytes32[] memory _proof, nftStruct memory leaf) public {

         emit proof(MerkleProof.verify(_proof, _root, _leaf));

    }
    /*
    //
    function structHashTest(bytes32 _leaf, verificationStruct memory leaf) public{

        bytes memory encoded;
        for (uint i = 0; i < leaf._subURIs.length; i++) {
            encoded = bytes.concat(
                encoded,
                abi.encodePacked(leaf._subURIs[i])
            );
        }
        emit verifyLeaf(_leaf, keccak256(abi.encodePacked(leaf._contract, leaf._distributor, leaf._baseURI, encoded)));
    }

    function structPassTest(verificationStruct memory v) public{
        emit verifyStruct(v._contract, v._distributor, v._baseURI);
    }*/


    function uriPrefix(string memory _baseURI) public pure returns(bool){
        return (keccak256(abi.encodePacked(bytes9( bytes(_baseURI) ) ) )  == keccak256(abi.encodePacked( bytes9("ipfs://Qm") ) ) );
    }

    function claimVerificationValue() public{
        payable(owner()).transfer(address(this).balance);
    }

}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CryptoGame.sol";

// MasterChef is the master of CryptoGame. He can make CryptoGame and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once CryptoGame is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract NFTChef is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Info of each nft.
    struct NFTInfo {
        uint256 amount; // How many LP tokens the NFT has staked.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of CryptoGames
        // entitled to a NFT but is pending to be distributed is:
        //
        //   pending reward = (NFT.amount * pool.accCryptoGamePerShare) - nft.rewardDebt
        //
        // Whenever a nft deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accCryptoGamePerShare` (and `lastRewardBlock`) gets updated.
        //   2. Nft receives the pending reward sent to his/her address.
        //   3. Nft's `amount` gets updated.
        //   4. Nft's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC721 nftToken; // Address of nft token contract.
        IERC20  colToken; // Address of colateral token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. CryptoGames to distribute per block.
        uint256 lastRewardBlock; // Last block number that CryptoGames distribution occurs.
        uint256 accCryptoGamePerShare; // Accumulated CryptoGames per share, times 1e12. See below.
    }
    // The CryptoGame TOKEN!
    CryptoGame public cryptoGame;
    // Dev address.
    address public devaddr;
    // Block number when bonus CryptoGame period ends.
    uint256 public bonusEndBlock;
    // CryptoGame tokens created per block.
    uint256 public CryptoGamePerBlock;
    // Bonus muliplier for early CryptoGame makers.
    uint256 public constant BONUS_MULTIPLIER = 10;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each nft that stakes collateral tokens.
    mapping(uint256 => mapping(uint256 => NFTInfo)) public nftInfo; // nftInfo[_pid][_id] == NFTInfo
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when CryptoGame mining starts.
    uint256 public startBlock;
    event Deposit(address indexed nft, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed nft, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed nft,
        uint256 indexed pid,
        uint256 amount
    );
    event Harvest(address indexed nft, uint256 indexed pid, uint256 pending);

    constructor(
        CryptoGame _cryptoGame,
        address _devaddr,
        uint256 _CryptoGamePerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock
    ) {
        cryptoGame = _cryptoGame;
        devaddr = _devaddr;
        CryptoGamePerBlock = _CryptoGamePerBlock;
        bonusEndBlock = _bonusEndBlock;
        startBlock = _startBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IERC721 _nftToken,
        IERC20 _colToken,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                nftToken: _nftToken,
                colToken: _colToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accCryptoGamePerShare: 0
            })
        );
    }

    // Update the given pool's CryptoGame allocation point. Can only be called by the owner. 
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
        
    }

    //TODO: add poolInfo[_pid].lastRewardBlock = startBlock

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        if (_to <= bonusEndBlock) {
            return _to.sub(_from).mul(BONUS_MULTIPLIER);
        } else if (_from >= bonusEndBlock) {
            return _to.sub(_from);
        } else {
            return
                bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER).add(
                    _to.sub(bonusEndBlock)
                );
        }
    }

    // View function to see pending CryptoGames on frontend.
    function pendingCryptoGame(uint256 _pid, uint256 _id)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        NFTInfo storage id = nftInfo[_pid][_id];
        uint256 accCryptoGamePerShare = pool.accCryptoGamePerShare;
        uint256 lpSupply = pool.colToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier =
                getMultiplier(pool.lastRewardBlock, block.number);
            uint256 CryptoGameReward =
                multiplier.mul(CryptoGamePerBlock).mul(pool.allocPoint).div(
                    totalAllocPoint
                );
            accCryptoGamePerShare = accCryptoGamePerShare.add(
                CryptoGameReward.mul(1e12).div(lpSupply)
            );
        }
        return id.amount.mul(accCryptoGamePerShare).div(1e12).sub(id.rewardDebt);
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.colToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 CryptoGameReward =
            multiplier.mul(CryptoGamePerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );
        cryptoGame.mint(devaddr, CryptoGameReward.div(10));
        cryptoGame.mint(address(this), CryptoGameReward);
        pool.accCryptoGamePerShare = pool.accCryptoGamePerShare.add(
            CryptoGameReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }



    // Deposit LP tokens to MasterChef for CryptoGame allocation.
    function deposit(address _sender, uint256 _pid, uint256 _tokenId, uint256 _amount) public onlyOwner{
        PoolInfo storage pool = poolInfo[_pid];
        NFTInfo storage nft = nftInfo[_pid][_tokenId];
        updatePool(_pid);
        pool.colToken.safeTransferFrom(
            address(_sender),
            address(this),
            _amount
        );
        nft.amount = nft.amount.add(_amount);
        nft.rewardDebt = nft.amount.mul(pool.accCryptoGamePerShare).div(1e12);
        emit Deposit(_sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(address _sender, uint256 _pid, uint256 _tokenId, uint256 _amount) public onlyOwner {
        PoolInfo storage pool = poolInfo[_pid];
        NFTInfo storage nft = nftInfo[_pid][_tokenId];
        require(nft.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending =
            nft.amount.mul(pool.accCryptoGamePerShare).div(1e12).sub(
                nft.rewardDebt
            );
        safeCryptoGameTransfer(_sender, pending);
        nft.amount = nft.amount.sub(_amount);
        nft.rewardDebt = nft.amount.mul(pool.accCryptoGamePerShare).div(1e12);
        pool.colToken.safeTransfer(address(_sender), _amount);
        emit Withdraw(_sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(address _sender, uint256 _pid, uint256 _tokenId) public onlyOwner {
        PoolInfo storage pool = poolInfo[_pid];
        NFTInfo storage nft = nftInfo[_pid][_tokenId];
        pool.colToken.safeTransfer(_sender, nft.amount);
        emit EmergencyWithdraw(_sender, _pid, nft.amount);
        nft.amount = 0;
        nft.rewardDebt = 0;
    }

     // Havest CryptoGame tokens from NFTChef.
    function harvest(address _sender, uint256 _pid, uint _id) public onlyOwner{
        PoolInfo storage pool = poolInfo[_pid];
        NFTInfo storage nft = nftInfo[_pid][_id];
        updatePool(_pid);
        uint256 pending =
            nft.amount.mul(pool.accCryptoGamePerShare).div(1e12).sub(
                nft.rewardDebt
            );
        safeCryptoGameTransfer(_sender, pending);
        nft.rewardDebt = nft.amount.mul(pool.accCryptoGamePerShare).div(1e12);
        emit Harvest(_sender, _pid, pending);
    }

    // Safe CryptoGame transfer function, just in case if rounding error causes pool to not have enough CryptoGames.
    function safeCryptoGameTransfer(address _to, uint256 _amount) internal {
        uint256 CryptoGameBal = cryptoGame.balanceOf(address(this));
        if (_amount > CryptoGameBal) {
            cryptoGame.transfer(_to, CryptoGameBal);
        } else {
            cryptoGame.transfer(_to, _amount);
        }
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}

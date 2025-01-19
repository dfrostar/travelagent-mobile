// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";

/// @custom:security-contact security@travelagent.app
contract TRAVLToken is ERC20, ERC20Burnable, ERC20Snapshot, AccessControl, ERC20Permit, ERC20Votes, ERC20FlashMint {
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Staking rewards
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStart;
    uint256 public constant STAKING_PERIOD = 30 days;
    uint256 public constant BASE_REWARD_RATE = 500; // 5% APR

    // Booking rewards
    uint256 public constant BOOKING_REWARD_RATE = 100; // 1% of booking value
    mapping(address => uint256) public bookingRewards;

    // Referral system
    mapping(address => address[]) public referrals;
    uint256 public constant REFERRAL_REWARD = 1000 * 10**18; // 1000 TRAVL tokens

    // Travel points conversion
    uint256 public constant POINTS_TO_TOKEN_RATE = 100; // 100 points = 1 TRAVL token

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event ReferralRewardPaid(address indexed referrer, address indexed referee, uint256 amount);
    event BookingRewardPaid(address indexed user, uint256 amount);
    event PointsConverted(address indexed user, uint256 points, uint256 tokens);

    constructor()
        ERC20("Travel Agent Token", "TRAVL")
        ERC20Permit("Travel Agent Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, 100000000 * 10**decimals()); // Initial supply: 100M tokens
    }

    // Snapshot functionality
    function snapshot() public onlyRole(SNAPSHOT_ROLE) {
        _snapshot();
    }

    // Minting functionality
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // Staking functionality
    function stake(uint256 amount) public {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        
        if (stakedBalance[msg.sender] > 0) {
            claimReward();
        }
        
        stakedBalance[msg.sender] += amount;
        stakingStart[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, amount);
    }

    function unstake() public {
        require(stakedBalance[msg.sender] > 0, "No tokens staked");
        require(block.timestamp >= stakingStart[msg.sender] + STAKING_PERIOD, "Staking period not completed");
        
        uint256 amount = stakedBalance[msg.sender];
        claimReward();
        
        stakedBalance[msg.sender] = 0;
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() public {
        require(stakedBalance[msg.sender] > 0, "No tokens staked");
        
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            _mint(msg.sender, reward);
            stakingStart[msg.sender] = block.timestamp;
            emit RewardPaid(msg.sender, reward);
        }
    }

    function calculateReward(address account) public view returns (uint256) {
        if (stakedBalance[account] == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - stakingStart[account];
        return (stakedBalance[account] * BASE_REWARD_RATE * timeElapsed) / (365 days * 10000);
    }

    // Booking rewards
    function addBookingReward(address user, uint256 bookingValue) public onlyRole(MINTER_ROLE) {
        uint256 reward = (bookingValue * BOOKING_REWARD_RATE) / 10000;
        _mint(user, reward);
        bookingRewards[user] += reward;
        emit BookingRewardPaid(user, reward);
    }

    // Referral system
    function addReferral(address referrer, address referee) public onlyRole(MINTER_ROLE) {
        require(referrer != referee, "Cannot refer yourself");
        referrals[referrer].push(referee);
        _mint(referrer, REFERRAL_REWARD);
        emit ReferralRewardPaid(referrer, referee, REFERRAL_REWARD);
    }

    // Points conversion
    function convertPointsToTokens(address user, uint256 points) public onlyRole(MINTER_ROLE) {
        uint256 tokens = points / POINTS_TO_TOKEN_RATE;
        require(tokens > 0, "Insufficient points for conversion");
        _mint(user, tokens * 10**decimals());
        emit PointsConverted(user, points, tokens);
    }

    // Governance functionality
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Snapshot)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}

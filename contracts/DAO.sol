// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./Spots.sol";

contract DAO is Ownable {

    Spots public spots;
    Proposal[] public proposals;

    mapping(address => uint64) public voting_weight_by_account;
    mapping(uint128 => int64) public vote_by_proposal_and_account;

    constructor(address payable spots_address) {
        spots = Spots(spots_address);
        proposals.push(Proposal(address(0), "", "", 0, 0, 0));
    }

    function get_voting_weight(address _address) public view returns(uint256) {
        return spots.balanceOf(_address) * 100 + spots.coupons(_address);
    }

    function propose(string memory title, string memory description, uint64 deadline) public {
        require(deadline > uint64(block.timestamp) + 24*3600, "cannot submit proposal: deadline needs to be at least 24h in the future");
        Proposal memory proposal = Proposal(msg.sender, title, description, deadline, 0, 0);
        proposals.push(proposal);
    }

    function vote(uint64 proposal_id, int8 vote_value) public {
        require(-1 <= vote_value && vote_value <= 1, "cannot vote: invalid vote value (must be -1, 0 or 1)");
        uint64 account_hash = _address_to_uint64(msg.sender);
        uint128 proposal_and_account = _encode_two_uint64_as_uint128(proposal_id, account_hash);
        int64 weighted_vote = vote_value * int64(voting_weight_by_account[msg.sender]);

        Proposal storage proposal = proposals[proposal_id];
        require(proposal.deadline >= uint64(block.timestamp), "cannot vote: voting period has already ended");
        
        int64 weighted_vote_diff = weighted_vote-vote_by_proposal_and_account[proposal_and_account];
        int64 weighted_vote_diff_abs = abs(weighted_vote)-abs(vote_by_proposal_and_account[proposal_and_account]);
        vote_by_proposal_and_account[proposal_and_account] += weighted_vote_diff;
        proposal.weighted_votes_sum += weighted_vote_diff;
        proposal.weighted_votes_abs = uint64(int64(proposal.weighted_votes_abs) + weighted_vote_diff_abs);
    }

    function _encode_two_uint64_as_uint128(uint64 a, uint64 b) public pure returns(uint128) {
        return uint128(a) * uint128(2**64-1) + uint128(b);
    }

    function _address_to_uint64(address _address) public pure returns(uint64) {
        return uint64(uint160(_address));
    }

    function abs(int64 x) private pure returns (int64) {
        return x >= 0 ? x : -x;
    }
}

struct Proposal {
    address proposer;
    string title;
    string description;
    uint64 deadline;
    int64 weighted_votes_sum;
    uint64 weighted_votes_abs;
}
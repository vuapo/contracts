// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import "hardhat/console.sol";
import "./VUAPO.sol";

contract VUAPO10 is Ownable, IERC721Receiver
{
    VUAPO public vuapo;

    constructor(address payable _vuapo_address) {
        vuapo = VUAPO(_vuapo_address);
    }

    function mint10() public payable {

        uint256 id0 = latest_minted_id()+1;

        bytes32[] memory proof;
        for(uint256 i = 0; i < 10; i++) {
            uint256 price = vuapo.calc_price();
            vuapo.mint{value: price}(proof);
            vuapo.transferFrom(address(this), payable(msg.sender), id0+i);
        }

        _send_entire_balance_to(payable(msg.sender));
    }

    function latest_minted_id() public view returns(uint256) {
        uint256 id = vuapo.total_sales()-1;
        require(_token_exists(id) && !_token_exists(id+1), "token ID already minted");
        return id;
    }

    function _send_entire_balance_to(address payable receiver) internal {
        uint256 balance = address(this).balance;
        (bool success, ) = receiver.call{value: balance}("");
        require(success, "Could not send entire balance to receiver.");
    }

    function onERC721Received(address, address, uint256, bytes memory) pure public override returns(bytes4) {
        return this.onERC721Received.selector;
    }

    function _token_exists(uint256 id) internal view returns(bool) {
        try vuapo.ownerOf(id) returns(address) {
            return true;
        } catch {
            return false;
        }
    }
}

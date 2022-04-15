// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import "./Spots.sol";

contract Listings is Ownable {

    Spots public spots;
    ERC20 public stablecoin;

    uint256 public amount_of_bookings = 0;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Booking) public bookings;
    mapping(uint256 => uint256[]) public bookings_by_listing;

    constructor(address payable spots_address, address stablecoin_address) {
        spots = Spots(spots_address);
        stablecoin = ERC20(stablecoin_address);
    }

    function list(uint256 id, int256 latitude, int256 longitude, uint256 cost, string memory metadata_url) public {
        require(spots.ownerOf(id) == msg.sender, "You do not own this Spot");
        listings[id] = Listing(latitude, longitude, cost, metadata_url);
    }

    function book(uint256 listing_id, uint256 timestamp_from, uint256 nights, string memory message) public {
        uint256 total_price = listings[listing_id].base_price * nights;
        require(stablecoin.allowance(msg.sender, address(this)) >= total_price, "Insufficient ERC20 allowance");
        require(stablecoin.transferFrom(msg.sender, address(this), total_price), "Could not transfer ERC20 to contract");

        uint booking_id = ++amount_of_bookings;
        bookings[booking_id] = Booking(block.timestamp, msg.sender, listing_id, timestamp_from, nights, total_price, message, false, false, false, false);
        bookings_by_listing[listing_id].push(booking_id);
    }

    function confirm_booking(uint256 booking_id) public {
        uint256 listing_id = bookings[booking_id].listing;
        require(spots.ownerOf(listing_id) == msg.sender, "You do not own this Spot");
        bookings[booking_id].confirmed = true;
    }

    function refund_booking(uint256 booking_id) public {
        uint256 listing_id = bookings[booking_id].listing;
        require(spots.ownerOf(listing_id) == msg.sender, "You do not own this Spot");
        _refund_booking(booking_id);
    }

    function _refund_booking(uint256 booking_id) internal {
        require(bookings[booking_id].paid_out == false, "The funds for this booking have already been paid out");
        require(bookings[booking_id].refunded == false, "The funds for this booking have already been refunded");
        bookings[booking_id].refunded = true;
        address payable receiver = payable(bookings[booking_id].guest);
        uint256 amount = bookings[booking_id].amount;
        require(stablecoin.transferFrom(address(this), receiver, amount), "Could not refund ERC20");
    }

    function pay_out_booking(uint256 booking_id) public {
        require(bookings[booking_id].guest == msg.sender, "You did not make this booking.");
        _pay_out_booking(booking_id);
    }

    function _pay_out_booking(uint256 booking_id) internal {
        require(bookings[booking_id].paid_out == false, "The funds for this booking have already been paid out");
        require(bookings[booking_id].refunded == false, "The funds for this booking have already been refunded");
        bookings[booking_id].paid_out = true;
        uint256 listing_id = bookings[booking_id].listing;
        address payable receiver = payable(spots.ownerOf(listing_id));
        uint256 amount = bookings[booking_id].amount;
        require(stablecoin.transferFrom(address(this), receiver, amount), "Could not pay out ERC20");
    }

    function open_dispute(uint256 booking_id) public {
        uint256 listing_id = bookings[booking_id].listing;
        bool is_spot_owner = spots.ownerOf(listing_id) == msg.sender;
        bool is_booker = bookings[booking_id].guest == msg.sender;
        require(is_spot_owner || is_booker, "You neither own this Spot not made the booking");
        bookings[booking_id].dispute = true;
    }

    function settle_dispute(uint256 booking_id, bool pay_out_dont_refund) onlyOwner public {
        require(bookings[booking_id].dispute, "No dispute has been opened for this booking");
        if(pay_out_dont_refund) {
            _pay_out_booking(booking_id);
        } else {
            _refund_booking(booking_id);
        }
    }

    function amount_of_bookings_for_listing(uint256 listing_id) public view returns(uint256) {
        return bookings_by_listing[listing_id].length;
    }
}

struct Listing {
    int256 latitude;
    int256 longitude;
    uint256 base_price;
    string metadata_url;
}

struct Booking {
    uint256 timestamp;
    address guest;
    uint256 listing;

    uint256 from_timestamp;
    uint256 nights;

    uint256 amount;
    string message;
    
    bool confirmed;
    bool paid_out;
    bool refunded;
    bool dispute;
}
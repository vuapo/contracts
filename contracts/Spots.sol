// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.7;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract Spots is ERC721A, Ownable
{
    // ====== VARIABLES =======
    uint256 public total_sales = 0;
    uint256 public sales_revenue = 0;
    uint256 public sales_revenue_withdrawn = 0;
    uint256 public sale_start = 0;

    // ====== SETTINGS =======
    uint256 public seconds_per_sale = 1 * 3600;
    uint256 public price_base = 1050;
    uint256 public start_price = 4.586 ether;

    string private base_uri;
    string public not_revealed_uri = "https://gateway.pinata.cloud/ipfs/QmYfvLErTYhteYKHxuqj29YAmy3J8MDwa3sipPjawDg37t";
    bool public revealed = false;
    address payable public withdrawal_address;

    mapping(address => uint256) public coupons;

    Bid[] public bids;
    DCAPlan[] public plans;
    Purchase[] public purchases;

    event Withdrawal(uint256 amount);
    event BidPlaced(Bid bid);
    event PlanStarted(DCAPlan plan);

    constructor(address payable _withdrawal_address) ERC721A("VUAPO", "SPOT") {
        withdrawal_address = _withdrawal_address;
        sale_start = block.timestamp;
    }

    // ============ PUBLIC FUNCTIONS ==============

    function mint(uint256 amount, bool as_coupons) payable public {
        uint256 total_price = calc_price(amount);
        _handle_payment(total_price);
        _mint(msg.sender, amount, as_coupons, total_price);
    }

    function mint_from_coupons(uint256 amount) payable public {
        require(coupons[msg.sender] >= amount, "Insufficient coupons");
        coupons[msg.sender] -= amount;
        _safeMint(msg.sender, amount);
    }

    function start_plan(uint256 duration_in_seconds) payable public {
        DCAPlan memory plan = DCAPlan(msg.sender, msg.value, 0, block.timestamp, block.timestamp + duration_in_seconds);
        plans.push(plan);
        emit PlanStarted(plan);
    }

    function end_plan(uint256 index) payable public {
        DCAPlan storage plan = plans[index];
        require(msg.sender == plan.address_, "You cannot end someone else's plan.");
        uint256 deposit = plan.deposit;
        plan.deposit = 0;
        (bool success, ) = payable(plan.address_).call{value: deposit}("");
        require(success, "Could not withdraw plan deposit");
    }

    function create_bid(uint256 price) payable public {
        require(msg.value > price, "Insufficient value sent to buy even one at ask price");
        Bid memory bid = Bid(msg.sender, price, msg.value);
        bids.push(bid);
        emit BidPlaced(bid);
    }

    function withdraw_bid(uint256 index) payable public {
        Bid storage bid = bids[index];
        require(msg.sender == bid.bidder, "You cannot withdraw someone else's bid.");
        uint256 deposit = bid.deposit;
        bid.deposit = 0;
        (bool success, ) = payable(bid.bidder).call{value: deposit}("");
        require(success, "Could not withdraw bid deposit");
    }

    function execute_bids() public {
        uint256 price = calc_price(1);
        for(uint256 i = 0; i < bids.length; i++) {
            Bid storage bid = bids[i];
            if(bid.deposit >= price && bid.price >= price) {
                uint256 amount = _calculate_purchase_maximum(bid.deposit, bid.price);
                uint256 total_price = calc_price(amount);
                bid.deposit -= total_price;
                sales_revenue += total_price;
                _mint(bid.bidder, amount, true, total_price);
                price = calc_price(1);
            }
        }
    }

    function execute_plans() public {
        uint256 price = calc_price(1);
        for(uint256 i = 0; i < plans.length; i++) {
            DCAPlan storage plan = plans[i];
            uint256 total_duration_in_seconds = plan.timestamp_to - plan.timestamp_from;
            uint256 total_budget = plan.deposit + plan.spent;
            uint256 budget_per_second = total_budget / total_duration_in_seconds;
            uint256 seconds_since_start = block.timestamp - plan.timestamp_from;
            uint256 value_available = min_unsigned(plan.deposit, budget_per_second * seconds_since_start - plan.spent);

            if(value_available > price) {
                uint256 amount = _calculate_purchase_maximum(value_available, 1e30);
                uint256 total_price = calc_price(amount);
                plan.deposit -= total_price;
                plan.spent += total_price;
                sales_revenue += total_price;
                _mint(plan.address_, amount, true, total_price);
                price = calc_price(1);
            }
        }
    }

    function _calculate_purchase_maximum(uint256 budget, uint256 max_price) internal view returns(uint256) {
        uint256 amount = 0;

        while(amount < 100) {
            if(calc_price(amount+1) >= budget) {
                break;
            }
            if(calc_price(amount+1) - calc_price(amount) > max_price) {
                break;
            }
            amount++;
        }
        return amount;
    }

    function calc_price(uint256 amount) public view returns(uint256) {
        uint256 price = 0;
        for(uint256 i = 0; i < amount; i++) {
            price += _calc_price_after_n_buys(i);
        }
        return price;
    }

    function transfer_coupons(address to, uint256 amount) public {
        require(coupons[msg.sender] >= amount, "Insufficient coupons");
        coupons[msg.sender] -= amount;
        coupons[to] += amount;
    }

    // ============ HELPER FUNCTIONS ==============

    function min_unsigned(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    function _handle_payment(uint256 total_price) internal {

        require(msg.value >= total_price, "insufficient price paid");
        sales_revenue += total_price;

        uint256 over_paid = msg.value - total_price;
        if(over_paid > 0) {
            (bool success, ) = payable(msg.sender).call{value: over_paid}("");
            require(success, "Could not refund overpaid token amount");
        }
    }

    function _mint(address receiver, uint256 amount, bool as_coupons, uint256 total_price) internal {        
        if(as_coupons) {
            coupons[receiver] += amount;
        } else {
            _safeMint(receiver, amount);
        }

        total_sales += amount;

        purchases.push(Purchase(receiver, amount, total_price, block.timestamp));
    }

    function purchases_length() public view returns(uint){
            return purchases.length;
    }

    function _calc_price_after_n_buys(uint256 n_buys) internal view returns(uint256) {
        uint256 sales_target = (block.timestamp - sale_start) / seconds_per_sale;
        int256 sales_lag = int256(total_sales) - int256(sales_target) + int256(n_buys);
        return start_price * _float_power(price_base, 3, sales_lag) / 1000;
    }

    function _float_power(uint256 base, uint256 base_decimals, int256 exponent) internal pure returns(uint256) {
        uint256 result = 10**base_decimals;
        if(exponent >= 0) {
            for(int256 i = 0; i < exponent; i++) {
                result *= base;
                result /= 10**base_decimals;
            }
        } else {
            for(int256 i = 0; i > exponent; i--) {
                result *= 10**base_decimals;
                result /= base;
            }
        }
        return result;
    }

    // ============ OWNER FUNCTIONS ==============

/*
    function airdrop_coupons_to_old_contract_owners(address old_contract_address) public onlyOwner() {
        ERC721A old_contract = ERC721A(old_contract_address);
        for(uint256 i = 0; i < old_contract.totalSupply(); i++) {
            address owner = old_contract.ownerOf(i);
            coupons[owner] += 1;
        }
    }*/

    function airdrop_coupons(address receiver, uint amount) public onlyOwner() {
        coupons[receiver] += amount;
    }

    function mint_coupons(address receiver, uint256 max_amount) public onlyOwner() {
        uint256 amount = min_unsigned(max_amount, coupons[receiver]);
        coupons[receiver] -= amount;
        _safeMint(receiver, amount);
    }

    function set_start_price(uint256 _start_price) public onlyOwner {
        start_price = _start_price;
    }

    function set_seconds_per_sale(uint256 _seconds_per_sale) public onlyOwner {
        seconds_per_sale = _seconds_per_sale;
    }

    function set_price_base(uint256 _price_base) public onlyOwner {
        price_base = _price_base;
    }

    function set_not_revealed_uri(string memory _not_revealed_uri) public onlyOwner {
        not_revealed_uri = _not_revealed_uri;
    }

    function set_base_uri(string calldata baseURI) external onlyOwner {
        base_uri = baseURI;
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    function withdraw() public {
        uint256 amount_to_withdraw = sales_revenue - sales_revenue_withdrawn;
        sales_revenue_withdrawn += amount_to_withdraw;
        (bool success, ) = withdrawal_address.call{value: amount_to_withdraw}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(amount_to_withdraw);
    }

    function start_sale() public onlyOwner {
        sale_start = block.timestamp;
    }

    // ============ TOKEN URI ==============
    
    function _baseURI() internal view virtual override returns (string memory) {
        return base_uri;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        if(revealed) {
            string memory _tokenURI = super.tokenURI(tokenId);
            return bytes(_tokenURI).length > 0 ? string(abi.encodePacked(_tokenURI, ".json")) : "";
        } else {
            return not_revealed_uri;
        }
    }

    struct Bid {
        address bidder;
        uint256 price;
        uint256 deposit;
    }

    struct DCAPlan {
        address address_;
        uint256 deposit;
        uint256 spent;
        uint256 timestamp_from;
        uint256 timestamp_to;
    }

    struct Purchase {
        address address_;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
    }
}
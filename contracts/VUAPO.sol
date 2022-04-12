// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.7;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract VUAPO is ERC721A, Ownable
{
    // ====== VARIABLES =======
    uint256 public total_sales = 0;
    uint256 public sale_start = 0;

    // ====== SETTINGS =======
    uint256 public seconds_per_sale = 1 * 3600;
    uint256 public price_exponent = 1030;
    uint256 public start_price = 0.005 ether;

    string private base_uri;
    string public not_revealed_uri;
    bool public revealed = false;
    bool public whitelist_enabled = false;
    bytes32 private whitelist;

    address payable public withdrawal_address;

    event Mint(address minter);
    event Withdrawal(uint256 amount);

    constructor(address payable _withdrawal_address) ERC721A("VUAPO", "SPOT") {
        withdrawal_address = _withdrawal_address;
    }

    // ============ PUBLIC FUNCTIONS ==============

    function mint(bytes32[] memory proof) payable public {
        require(sale_start > 0, "sale hasn't started yet");
        uint256 price = calc_price();
        require(msg.value == price, "invalid price paid");
        require(!whitelist_enabled || verify(proof), "Address not whitelisted");
        
        _safeMint(msg.sender, 1);
        total_sales += 1;
        emit Mint(msg.sender);
    }

    function keccak256_address(address _address) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_address));
    }

    function verify(bytes32[] memory proof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        return MerkleProof.verify(proof, whitelist, leaf);
    }

    function calc_price() public view returns(uint256) {
        require(sale_start > 0, "sale hasn't started yet");
        uint256 sales_target = (block.timestamp - sale_start) / seconds_per_sale;
        int256 sales_lag = int256(total_sales) - int256(sales_target);
        return start_price * float_power(price_exponent, 3, sales_lag) / 1000;
    }

    function float_power(uint256 base, uint256 base_decimals, int256 exponent) internal pure returns(uint256) {
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
    
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a >= b ? a : b;
    }
    
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a <= b ? a : b;
    }

    // ============ OWNER FUNCTIONS ==============

    function set_start_price(uint256 _start_price) public onlyOwner {
        start_price = _start_price;
    }

    function set_seconds_per_sale(uint256 _seconds_per_sale) public onlyOwner {
        seconds_per_sale = _seconds_per_sale;
    }

    function set_price_exponent(uint256 _price_exponent) public onlyOwner {
        price_exponent = _price_exponent;
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
        uint256 balance = address(this).balance;
        (bool success, ) = withdrawal_address.call{value: balance}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(balance);
    }

    function set_whitelist(bytes32 _whitelist) external onlyOwner {
        whitelist = _whitelist;
    }

    function flip_whitelist_enabled() public onlyOwner {
        whitelist_enabled = !whitelist_enabled;
    }

    function start_sale() public onlyOwner {
        require(sale_start == 0, "sale already started");
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
}

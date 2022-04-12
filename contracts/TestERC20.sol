// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("USD-Tether", "USDT") {
        _mint(msg.sender, 100 * 10**uint(decimals()));
    }
}
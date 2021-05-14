// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

contract ForceETH {
    constructor(address payable _to) public payable {
        selfdestruct(_to);
    }
}

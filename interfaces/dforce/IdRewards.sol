// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IdRewards {
    function earned(address account) external view returns(uint256);
}
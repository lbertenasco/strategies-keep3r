// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IDRewards {
    function earned(address account) external view returns (uint256);
}

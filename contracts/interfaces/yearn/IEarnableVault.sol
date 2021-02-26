// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IEarnableVault {
    function earn() external;

    function available() external view returns (uint256 _available);
}

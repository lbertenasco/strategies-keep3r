// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IEarnableVault {
    function earn() external;
    function available() external view returns (uint _available);
}

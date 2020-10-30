// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IKeep3rV1 {
    function name() external returns (string memory);
    function isKeeper(address) external returns (bool);
    function worked(address keeper) external;
}
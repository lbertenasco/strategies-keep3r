// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IKeep3rJob {
    function work(bytes calldata _workData) external;

    // use callStatic for the following functions:
    function workable() external returns (bool);

    function getWorkData() external returns (bytes memory _workData);
}

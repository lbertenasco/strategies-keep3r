// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IKeep3rJob {
    // function workable() external view returns (bool _workable);
    // function getWorkData() external view returns (bytes memory _workData);

    function work(bytes calldata _workData) external;

    function forceWork(bytes calldata _workData) external;
}

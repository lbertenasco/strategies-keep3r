// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
interface IKeep3rJob {

    function isKeep3rJob() external pure returns (bool);

    // Mock functions
    // function workable() external view returns (bool);
    // function work() external;
    // function forceWork() external;

}

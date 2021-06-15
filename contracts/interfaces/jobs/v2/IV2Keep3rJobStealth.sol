// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import "./IV2Keep3rJob.sol";

interface IV2Keep3rStealthJob is IV2Keep3rJob {
    function forceWorkUnsafe(address _strategy) external;
}

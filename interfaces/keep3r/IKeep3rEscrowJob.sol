// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "./IKeep3rEscrow.sol";

interface IKeep3rEscrowJob {

    enum Actions { none, addLiquidityToJob, applyCreditToJob, removeLiquidityFromJob }
    function isKeep3rEscrowJob() external pure returns (bool);

    // Actions by Keeper
    event WorkByKeeper();
    // Actions forced by governor
    event WorkByGovernor();
    // Keep3r actions
    function work() external;
    // Governor Keeper bypass
    function forceWork() external;
    function returnLPsToGovernance(address _escrow) external;
    function addLiquidityToJob(address _escrow) external;
    function applyCreditToJob(address _escrow) external;
    function unbondLiquidityFromJob(address _escrow) external;
    function removeLiquidityFromJob(address _escrow) external;
    // Governor utils bypass
    function setPendingGovernorOnEscrow(address _escrow, address _pendingGovernor) external;
    function acceptGovernorOnEscrow(address _escrow) external;
    function sendDustOnEscrow(address _escrow, address _to, address _token, uint256 _amount) external;

    // Getters
    function getNextAction() external view returns (IKeep3rEscrow Escrow, Actions _action);
    function workable() external view returns (bool);
}

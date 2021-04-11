// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import "../IKeep3rJob.sol";

interface IV2QueueKeep3rJob is IKeep3rJob {
    event Keep3rSet(address keep3r);
    event Keep3rHelperSet(address keep3rHelper);
    event SlidingOracleSet(address slidingOracle);

    // Setters
    event StrategyAdded(address _strategy, uint256 _requiredAmount);
    event StrategyModified(address _strategy, uint256 _requiredAmount);
    event StrategyRemoved(address _strategy);

    // Actions by Keeper
    event Worked(address _strategy, uint256 _workAmount, address _keeper, uint256 _credits, bool _workForTokens);

    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Getters
    function strategies() external view returns (address[] memory);

    function workable(address _strategy, uint256 _workAmount) external view returns (bool);

    // Setters
    function setV2Keep3r(address _v2Keeper) external;

    function setOracle(address _oracle) external;

    function setKeep3rHelper(address _keep3rHelper) external;

    function setWorkCooldown(uint256 _workCooldown) external;

    function addStrategy(
        address _strategy,
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts
    ) external;

    function removeStrategy(address _strategy) external;

    // Keeper actions
    function work(address _strategy, uint256 _workAmount) external returns (uint256 _credits);

    function workForBond(address _strategy, uint256 _workAmount) external returns (uint256 _credits);

    function workForTokens(address _strategy, uint256 _workAmount) external returns (uint256 _credits);

    // Mechanics keeper bypass
    function forceWork(address _strategy) external;
}

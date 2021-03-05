// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IV2Keep3rJob {
    event Keep3rSet(address keep3r);
    event Keep3rHelperSet(address keep3rHelper);
    event SlidingOracleSet(address slidingOracle);

    // Actions by Keeper
    event Worked(address _strategy);
    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Getters
    function strategies() external view returns (address[] memory);

    function workableStrategy(address _strategy) external view returns (bool);

    event StrategyAdded(address _strategy, uint256 _requiredAmount);

    event StrategyModified(address _strategy, uint256 _requiredAmount);

    event StrategyRemoved(address _strategy);

    // Setters
    function setWorkCooldown(uint256 _workCooldown) external;

    function addStrategies(address[] calldata _strategy, uint256[] calldata _requiredAmount) external;

    function addStrategy(address _strategy, uint256 _requiredAmount) external;

    function updateRequiredAmounts(address[] calldata _strategies, uint256[] calldata _requiredAmounts) external;

    function updateRequiredAmount(address _strategy, uint256 _requiredAmount) external;

    function removeStrategy(address _strategy) external;

    // Mechanics keeper bypass
    function forceWork(address _strategy) external;
}

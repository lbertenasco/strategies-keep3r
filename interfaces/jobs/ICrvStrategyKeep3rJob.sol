// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ICrvStrategyKeep3rJob {
    event StrategyAdded(address _strategy, uint256 _requiredHarvest);
    event StrategyModified(address _strategy, uint256 _requiredHarvest);
    event StrategyRemoved(address _strategy);

    // Actions by Keeper
    event Worked(address _strategy);
    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Setters
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external;

    function addStrategy(address _strategy, uint256 _requiredHarvest) external;

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external;

    function removeStrategy(address _strategy) external;

    // Getters
    function strategies() external view returns (address[] memory _strategies);

    function calculateHarvest(address _strategy) external returns (uint256 _amount);

    function availableThreshold() external view returns (uint256 _availableThreshold);

    // Mechanics Setters
    function setMaxCredits(uint256 _maxCredits) external;

    function setAvailableThreshold(uint256 _availableThreshold) external;

    // Mechanics keeper bypass
    function forceWork(address _strategy) external;
}

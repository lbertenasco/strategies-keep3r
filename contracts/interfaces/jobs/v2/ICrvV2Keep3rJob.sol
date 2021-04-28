// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ICrvV2Keep3rJob {
    event V1StrategyAdded(address _strategy, uint256 _requiredAmount, uint256 _requiredEarn);
    event V1StrategyModified(address _strategy, uint256 _requiredAmount, uint256 _requiredEarn);

    // Actions by Keeper
    event Worked(address _strategy, address _keeper, uint256 _credits, bool _workForTokens);

    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Setters
    function addV1Strategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts,
        uint256[] calldata _requiredEarns
    ) external;

    function addV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) external;

    function updateV1Strategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts,
        uint256[] calldata _requiredEarns
    ) external;

    function updateV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) external;

    function setMaxHarvestPeriod(uint256 _maxHarvestPeriod) external;

    function setHarvestCooldown(uint256 _harvestCooldown) external;

    // Getters
    function workableStatic(address _strategy) external returns (bool);

    function requiredEarn(address _strategy) external view returns (uint256 _requiredEarn);

    function maxHarvestPeriod() external view returns (uint256 _maxHarvestPeriod);

    function lastHarvest() external view returns (uint256 _lastHarvest);

    function harvestCooldown() external view returns (uint256 _harvestCooldown);

    function calculateV1Harvest(address _strategy) external returns (uint256 _amount);
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IHarvestV2Keep3rJob {
    event Keep3rSet(address keep3r);
    event Keep3rHelperSet(address keep3rHelper);
    event SlidingOracleSet(address slidingOracle);

    // Actions by Keeper
    event Worked(address _strategy);
    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Getters
    function strategies() external view returns (address[] memory);

    function harvestable(address _strategy) external view returns (bool);

    event HarvestStrategyAdded(address _strategy, uint256 _requiredHarvest);

    event HarvestStrategyModified(address _strategy, uint256 _requiredHarvest);

    event HarvestStrategyRemoved(address _strategy);

    // Setters
    function setHarvestCooldown(uint256 _harvestCooldown) external;

    function setMaxCredits(uint256 _maxCredits) external;

    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external;

    function addStrategy(address _strategy, uint256 _requiredHarvest) external;

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external;

    function removeStrategy(address _strategy) external;

    // Governor work bypass
    function forceWork(address _strategy) external;
}

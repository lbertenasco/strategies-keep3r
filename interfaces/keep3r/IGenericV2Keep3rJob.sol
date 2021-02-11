// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IGenericV2Keep3rJob {
    event Keep3rSet(address keep3r);
    event Keep3rHelperSet(address keep3rHelper);
    event SlidingOracleSet(address slidingOracle);

    // Actions by Keeper
    event HarvestedByKeeper(address _strategy);
    event TendedByKeeper(address _strategy);

    // Actions forced by governance
    event HarvestedByGovernor(address _strategy);
    event TendedByGovernor(address _strategy);

    // Getters
    function strategies() external view returns (address[] memory);

    function harvestable(address _strategy) external view returns (bool);

    function tendable(address _strategy) external view returns (bool);

    // Keep3r actions
    function harvest(address _strategy) external;

    function tend(address _strategy) external;

    // Governor keeper bypass
    function forceHarvest(address _strategy) external;

    function forceTend(address _strategy) external;

    // Name of the Keep3r
    function name() external pure returns (string memory);

    event HarvestStrategyAdded(address _strategy, uint256 _requiredHarvest);
    event TendStrategyAdded(address _strategy, uint256 _requiredTend);

    event HarvestStrategyModified(address _strategy, uint256 _requiredHarvest);
    event TendStrategyModified(address _strategy, uint256 _requiredTend);

    event StrategyRemoved(address _strategy);
    event HarvestStrategyRemoved(address _strategy);
    event TendStrategyRemoved(address _strategy);

    // Setters
    function setHarvestCooldown(uint256 _harvestCooldown) external;

    function setTendCooldown(uint256 _tendCooldown) external;

    function setMaxCredits(uint256 _maxCredits) external;

    function addStrategies(
        address[] calldata _strategy,
        uint256[] calldata _requiredHarvest,
        uint256[] calldata _requiredTend
    ) external;

    function addStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredTend
    ) external;

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external;

    function updateRequiredTendAmount(address _strategy, uint256 _requiredTend) external;

    function removeStrategy(address _strategy) external;

    function removeHarvestStrategy(address _strategy) external;

    function removeTendStrategy(address _strategy) external;
}

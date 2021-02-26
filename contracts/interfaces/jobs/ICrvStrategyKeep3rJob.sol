// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ICrvStrategyKeep3rJob {
    event StrategyAdded(address _strategy, uint256 _requiredHarvest, uint256 _requiredEarn);
    event StrategyModified(address _strategy, uint256 _requiredHarvest, uint256 _requiredEarn);
    event StrategyRemoved(address _strategy);

    // Actions by Keeper
    event Worked(address _strategy);
    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Setters
    function addStrategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredHarvests,
        uint256[] calldata _requiredEarns
    ) external;

    function addStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredEarn
    ) external;

    function updateStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredEarn
    ) external;

    function removeStrategy(address _strategy) external;

    // Getters
    function strategies() external view returns (address[] memory _strategies);

    function requiredHarvest(address _strategy) external view returns (uint256 _requiredHarvest);

    function requiredEarn(address _strategy) external view returns (uint256 _requiredEarn);

    function calculateHarvest(address _strategy) external returns (uint256 _amount);

    // Mechanics Setters
    function setMaxCredits(uint256 _maxCredits) external;

    // Mechanics keeper bypass
    function forceWork(address _strategy) external;
}

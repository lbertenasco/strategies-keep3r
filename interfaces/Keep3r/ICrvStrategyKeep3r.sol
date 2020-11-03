// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface ICrvStrategyKeep3r {
  event StrategyAdded(address _strategy, uint256 _requiredHarvest);
  event StrategyModified(address _strategy, uint256 _requiredHarvest);
  event StrategyRemoved(address _strategy);
  function isCrvStrategyKeep3r() external pure returns (bool);
  // Setters
  function addStrategy(address _strategy, uint256 _requiredHarvest) external;
  function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external;
  function removeStrategy(address _strategy) external;
}
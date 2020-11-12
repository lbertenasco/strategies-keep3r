// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IStrategyKeep3r {
  event Keep3rSet(address keep3r);
  event Keep3rRequirementsSet(address bond, uint256 minBond, uint256 earned, uint256 age);
  // Actions by Keeper
  event HarvestedByKeeper(address _strategy);
  // Actions forced by governance
  event HarvestedByGovernor(address _strategy);
  // Keep3rSetters
  function setKeep3r(address _keep3r) external;
  function setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age) external;
  // Keep3r actions
  function harvest(address _strategy) external;
  // Governance Keeper bypass
  function forceHarvest(address _strategy) external;
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IStrategyKeep3r {
  event Keep3rSet(address keep3r);
  // Actions by Keeper
  event HarvestedByKeeper(address _strategy);
  // Actions forced by governance
  event HarvestedByGovernor(address _strategy);
  // Setters
  function setKeep3r(address _keep3r) external;
  // Keep3r actions
  function harvest(address _strategy) external;
  // Governance Keeper bypass
  function forceHarvest(address _strategy) external;
}
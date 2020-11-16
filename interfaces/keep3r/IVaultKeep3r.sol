// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import "./IKeep3r.sol";
interface IVaultKeep3r is IKeep3r {
  event VaultAdded(address _vault, uint256 _requiredEarn);
  event VaultModified(address _vault, uint256 _requiredEarn);
  event VaultRemoved(address _vault);
  function isVaultKeep3r() external pure returns (bool);

  // Actions by Keeper
  event EarnByKeeper(address _vault);
  // Actions forced by governance
  event EarnByGovernor(address _vault);
  // Keep3r actions
  function earn(address _vault) external;
  // Governance Keeper bypass
  function forceEarn(address _vault) external;
  
  // Setters
  function addVault(address _vault, uint256 _requiredEarn) external;
  function updateRequiredEarnAmount(address _vault, uint256 _requiredEarn) external;
  function removeVault(address _vault) external;
  function setEarnCooldown(uint256 _earnCooldown) external;
  // Getters
  function vaults() external view returns (address[] memory _vaults);
  function calculateEarn(address _vault) external returns (uint256 _amount);
  function workable(address _vault) external returns (bool);
}

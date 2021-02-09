// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IVaultKeep3rJob {
    event VaultAdded(address _vault, uint256 _requiredEarn);
    event VaultModified(address _vault, uint256 _requiredEarn);
    event VaultRemoved(address _vault);

    function isVaultKeep3rJob() external pure returns (bool);

    // Actions by Keeper
    event EarnByKeeper(address _vault);
    // Actions forced by governance
    event EarnByGovernor(address _vault);

    // Keep3r actions
    function workable(address _vault) external view returns (bool);

    function work(address _vault) external;

    // Governance Keeper bypass
    function forceWork(address _vault) external;

    // Setters
    function addVaults(address[] calldata _vaults, uint256[] calldata _requiredEarns) external;

    function addVault(address _vault, uint256 _requiredEarn) external;

    function updateRequiredEarnAmount(address _vault, uint256 _requiredEarn) external;

    function removeVault(address _vault) external;

    function setEarnCooldown(uint256 _earnCooldown) external;

    // Getters
    function vaults() external view returns (address[] memory _vaults);

    function calculateEarn(address _vault) external view returns (uint256 _amount);
}

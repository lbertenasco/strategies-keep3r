// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IVaultKeep3rJob {
    event VaultAdded(address _vault, uint256 _requiredEarn);
    event VaultModified(address _vault, uint256 _requiredEarn);
    event VaultRemoved(address _vault);

    // Actions by Keeper
    event Worked(address _vault);
    // Actions forced by Governor
    event ForceWorked(address _vault);

    // Setters
    function addVaults(address[] calldata _vaults, uint256[] calldata _requiredEarns) external;

    function addVault(address _vault, uint256 _requiredEarn) external;

    function updateVaults(address[] calldata _vaults, uint256[] calldata _requiredEarns) external;

    function updateVault(address _vault, uint256 _requiredEarn) external;

    function removeVault(address _vault) external;

    function setEarnCooldown(uint256 _earnCooldown) external;

    // Getters
    function vaults() external view returns (address[] memory _vaults);

    function calculateEarn(address _vault) external view returns (uint256 _amount);

    // Mechanics Setters
    function setMaxGasPrice(uint256 _maxGasPrice) external;

    // Mechanics keeper bypass
    function forceWork(address _vault) external;
}

// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";

import "../proxy-job/Keep3rJob.sol";
import "../interfaces/jobs/IVaultKeep3rJob.sol";

import "../interfaces/yearn/IEarnableVault.sol";

contract VaultKeep3rJob is MachineryReady, Keep3rJob, IVaultKeep3rJob {
    using SafeMath for uint256;

    mapping(address => uint256) public requiredEarn;
    mapping(address => uint256) public lastEarnAt;
    uint256 public earnCooldown;
    EnumerableSet.AddressSet internal _availableVaults;

    constructor(
        address _mechanicsRegistry,
        address _keep3rProxyJob,
        uint256 _earnCooldown,
        uint256 _maxGasPrice
    ) public MachineryReady(_mechanicsRegistry) Keep3rJob(_keep3rProxyJob) {
        _setEarnCooldown(_earnCooldown);
        _setMaxGasPrice(_maxGasPrice);
    }

    // Setters
    function addVaults(address[] calldata _vaults, uint256[] calldata _requiredEarns) external override onlyGovernorOrMechanic {
        require(_vaults.length == _requiredEarns.length, "VaultKeep3rJob::add-vaults:vaults-required-earns-different-length");
        for (uint256 i; i < _vaults.length; i++) {
            _addVault(_vaults[i], _requiredEarns[i]);
        }
    }

    function addVault(address _vault, uint256 _requiredEarn) external override onlyGovernorOrMechanic {
        _addVault(_vault, _requiredEarn);
    }

    function _addVault(address _vault, uint256 _requiredEarn) internal {
        require(requiredEarn[_vault] == 0, "VaultKeep3rJob::add-vault:vault-already-added");
        _setRequiredEarn(_vault, _requiredEarn);
        _availableVaults.add(_vault);
        emit VaultAdded(_vault, _requiredEarn);
    }

    function updateVaults(address[] calldata _vaults, uint256[] calldata _requiredEarns) external override onlyGovernorOrMechanic {
        require(_vaults.length == _requiredEarns.length, "VaultKeep3rJob::update-vaults:vaults-required-earns-different-length");
        for (uint256 i; i < _vaults.length; i++) {
            _updateVault(_vaults[i], _requiredEarns[i]);
        }
    }

    function updateVault(address _vault, uint256 _requiredEarn) external override onlyGovernorOrMechanic {
        _updateVault(_vault, _requiredEarn);
    }

    function _updateVault(address _vault, uint256 _requiredEarn) internal {
        require(requiredEarn[_vault] > 0, "VaultKeep3rJob::update-required-earn:vault-not-added");
        _setRequiredEarn(_vault, _requiredEarn);
        emit VaultModified(_vault, _requiredEarn);
    }

    function removeVault(address _vault) external override onlyGovernorOrMechanic {
        require(requiredEarn[_vault] > 0, "VaultKeep3rJob::remove-vault:vault-not-added");
        requiredEarn[_vault] = 0;
        _availableVaults.remove(_vault);
        emit VaultRemoved(_vault);
    }

    function _setRequiredEarn(address _vault, uint256 _requiredEarn) internal {
        require(_requiredEarn > 0, "VaultKeep3rJob::set-required-earn:should-not-be-zero");
        requiredEarn[_vault] = _requiredEarn;
    }

    function setEarnCooldown(uint256 _earnCooldown) external override onlyGovernorOrMechanic {
        _setEarnCooldown(_earnCooldown);
    }

    function _setEarnCooldown(uint256 _earnCooldown) internal {
        require(_earnCooldown > 0, "VaultKeep3rJob::set-earn-cooldown:should-not-be-zero");
        earnCooldown = _earnCooldown;
    }

    // Getters
    function vaults() public view override returns (address[] memory _vaults) {
        _vaults = new address[](_availableVaults.length());
        for (uint256 i; i < _availableVaults.length(); i++) {
            _vaults[i] = _availableVaults.at(i);
        }
    }

    // Job actions
    function getWorkData() public override returns (bytes memory _workData) {
        for (uint256 i; i < _availableVaults.length(); i++) {
            address _vault = _availableVaults.at(i);
            if (_workable(_vault)) return abi.encode(_vault);
        }
    }

    function decodeWorkData(bytes memory _workData) public pure returns (address _vault) {
        return abi.decode(_workData, (address));
    }

    function calculateEarn(address _vault) public view override returns (uint256 _amount) {
        require(requiredEarn[_vault] > 0, "VaultKeep3rJob::calculate-earn:vault-not-added");
        return IEarnableVault(_vault).available();
    }

    function workable() public override notPaused returns (bool) {
        for (uint256 i; i < _availableVaults.length(); i++) {
            if (_workable(_availableVaults.at(i))) return true;
        }
        return false;
    }

    function _workable(address _vault) internal view returns (bool) {
        require(requiredEarn[_vault] > 0, "VaultKeep3rJob::workable:vault-not-added");
        return (calculateEarn(_vault) >= requiredEarn[_vault] && block.timestamp > lastEarnAt[_vault].add(earnCooldown));
    }

    // Keep3r actions
    function work(bytes memory _workData) external override notPaused onlyProxyJob limitGasPrice {
        address _vault = decodeWorkData(_workData);
        require(_workable(_vault), "VaultKeep3rJob::earn:not-workable");

        _earn(_vault);

        emit Worked(_vault);
    }

    // Mechanics Setters
    function setMaxGasPrice(uint256 _maxGasPrice) external override onlyGovernorOrMechanic {
        _setMaxGasPrice(_maxGasPrice);
    }

    // Mechanics keeper bypass
    function forceWork(address _vault) external override onlyGovernorOrMechanic {
        _earn(_vault);
        emit ForceWorked(_vault);
    }

    function _earn(address _vault) internal {
        IEarnableVault(_vault).earn();
        lastEarnAt[_vault] = block.timestamp;
    }
}

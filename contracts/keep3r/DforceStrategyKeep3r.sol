// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol';

import '../../interfaces/keep3r/IStrategyKeep3r.sol';
import '../../interfaces/keep3r/IDforceStrategyKeep3r.sol';
import '../../interfaces/dforce/IDRewards.sol';
import '../../interfaces/dforce/IDforceStrategy.sol';

import '../utils/Governable.sol';
import '../utils/CollectableDust.sol';

contract DforceStrategyKeep3r is Governable, CollectableDust, Keep3r, IStrategyKeep3r, IDforceStrategyKeep3r {
  using SafeMath for uint256;

  mapping(address => uint256) public requiredHarvest;

  EnumerableSet.AddressSet internal availableStrategies;

  constructor(
    address _keep3r,
    address _bond,
    uint256 _minBond,
    uint256 _earned,
    uint256 _age,
    bool _onlyEOA
  ) public Governable(msg.sender) CollectableDust() Keep3r(_keep3r) { 
    _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
  }

  function isDforceStrategyKeep3r() external pure override returns (bool) { return true; }

  // Setters
  function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
    require(requiredHarvest[_strategy] == 0, 'dforce-strategy-keep3r::add-strategy:strategy-already-added');
    _setRequiredHarvest(_strategy, _requiredHarvest);
    availableStrategies.add(_strategy);
    emit StrategyAdded(_strategy, _requiredHarvest);
  }
  function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
    require(requiredHarvest[_strategy] > 0, 'dforce-strategy-keep3r::update-required-harvest:strategy-not-added');
    _setRequiredHarvest(_strategy, _requiredHarvest);
    emit StrategyModified(_strategy, _requiredHarvest);
  }
  function removeStrategy(address _strategy) external override onlyGovernor {
    require(requiredHarvest[_strategy] > 0, 'dforce-strategy-keep3r::remove-strategy:strategy-not-added');
    requiredHarvest[_strategy] = 0;
    availableStrategies.remove(_strategy);
    emit StrategyRemoved(_strategy);
  }
  function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
    require(_requiredHarvest > 0, 'dforce-strategy-keep3r::set-required-harvest:should-not-be-zero');
    requiredHarvest[_strategy] = _requiredHarvest;
  }
  
  // Keep3r Setters
  function setKeep3r(address _keep3r) external override onlyGovernor {
    _setKeep3r(_keep3r);
    emit Keep3rSet(_keep3r);
  }
  function setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA) external override onlyGovernor {
    _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
    emit Keep3rRequirementsSet(_bond, _minBond, _earned, _age, _onlyEOA);
  }


  // Getters
  function strategies() public view override returns (address[] memory _strategies) {
    _strategies = new address[](availableStrategies.length());
    for (uint i; i < availableStrategies.length(); i++) {
      _strategies[i] = availableStrategies.at(i);
    }
  }
  function calculateHarvest(address _strategy) public view override returns (uint256 _amount) {
    require(requiredHarvest[_strategy] > 0, 'dforce-strategy-keep3r::calculate-harvest:strategy-not-added');
    address _pool = IDforceStrategy(_strategy).pool();
    return IDRewards(_pool).earned(_strategy);
  }
  function workable(address _strategy) public view override returns (bool) {
    require(requiredHarvest[_strategy] > 0, 'dforce-strategy-keep3r::workable:strategy-not-added');
    return calculateHarvest(_strategy) >= requiredHarvest[_strategy];
  }


  // Keep3r actions
  function harvest(address _strategy) external override onlyKeeper paysKeeper {
    require(workable(_strategy), 'dforce-strategy-keep3r::harvest:not-workable');
    _harvest(_strategy);
    emit HarvestByKeeper(_strategy);
  }


  // Governor keeper bypass
  function forceHarvest(address _strategy) external override onlyGovernor {
    _harvest(_strategy);
    emit HarvestByGovernor(_strategy);
  }

  function _harvest(address _strategy) internal {
    IHarvestableStrategy(_strategy).harvest();
  }


  // Governable
  function setPendingGovernor(address _pendingGovernor) external override onlyGovernor {
    _setPendingGovernor(_pendingGovernor);
  }

  function acceptGovernor() external override onlyPendingGovernor {
    _acceptGovernor();
  }

  // Collectable Dust
  function sendDust(
    address _to,
    address _token,
    uint256 _amount
  ) external override onlyGovernor {
    _sendDust(_to, _token, _amount);
  }
}

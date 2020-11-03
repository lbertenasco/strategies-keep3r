// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '@openzeppelin/contracts/math/SafeMath.sol';

import '../../interfaces/Keep3r/IStrategyKeep3r.sol';
import '../../interfaces/Keep3r/ICrvStrategyKeep3r.sol';
import '../../interfaces/crv/ICrvStrategy.sol';
import '../../interfaces/crv/ICrvClaimable.sol';

import '../utils/Governable.sol';
import '../utils/CollectableDust.sol';

import './Keep3rAbstract.sol';

contract CrvStrategyKeep3r is Governable, CollectableDust, Keep3r, IStrategyKeep3r, ICrvStrategyKeep3r {
  using SafeMath for uint256;
  
  mapping(address => uint256) public requiredHarvest;

  constructor(address _keep3r) public Governable(msg.sender) CollectableDust() Keep3r(_keep3r) { 
  }

  function isCrvStrategyKeep3r() external pure override returns (bool) { return true; }

  // Setters
  function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
    require(requiredHarvest[_strategy] == 0, 'crv-strategy-keep3r::add-strategy:strategy-already-added');
    _setRequiredHarvest(_strategy, _requiredHarvest);
    emit StrategyAdded(_strategy, _requiredHarvest);
  }
  function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
    require(requiredHarvest[_strategy] > 0, 'crv-strategy-keep3r::update-required-harvest:strategy-not-added');
    _setRequiredHarvest(_strategy, _requiredHarvest);
    emit StrategyModified(_strategy, _requiredHarvest);
  }
  function removeStrategy(address _strategy) external override onlyGovernor {
    require(requiredHarvest[_strategy] > 0, 'crv-strategy-keep3r::remove-strategy:strategy-not-added');
    requiredHarvest[_strategy] = 0;
    emit StrategyRemoved(_strategy);
  }
  function setKeep3r(address _keep3r) external override onlyGovernor {
    _setKeep3r(_keep3r);
    emit Keep3rSet(_keep3r);
  }
  function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
    require(_requiredHarvest > 0, 'crv-strategy-keep3r::set-required-harvest:should-not-be-zero');
    requiredHarvest[_strategy] = _requiredHarvest;
  }


  // Getters
  function calculateHarvest(address _strategy) public override returns (uint256 _amount) {
    require(requiredHarvest[_strategy] > 0, 'crv-strategy-keep3r::calculate-harvest:strategy-not-added');
    address _gauge = ICrvStrategy(_strategy).gauge();
    address _voter = ICrvStrategy(_strategy).voter();
    return ICrvClaimable(_gauge).claimable_tokens(_voter);
  }
  function workable(address _strategy) public override returns (bool) {
    require(requiredHarvest[_strategy] > 0, 'crv-strategy-keep3r::workable:strategy-not-added');
    return calculateHarvest(_strategy) >= requiredHarvest[_strategy];
  }


  // Keep3r actions
  function harvest(address _strategy) external override paysKeeper {
    require(workable(_strategy), 'crv-strategy-keep3r::harvest:not-workable');
    _harvest(_strategy);
    emit HarvestedByKeeper(_strategy);
  }


  // Governor keeper bypass
  function forceHarvest(address _strategy) external override onlyGovernor {
    _harvest(_strategy);
    emit HarvestedByGovernor(_strategy);
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
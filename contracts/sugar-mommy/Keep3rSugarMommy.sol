// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/EnumerableSet.sol';
import '@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol';
import '@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol';

import '../../interfaces/sugar-mommy/IKeep3rSugarMommy.sol';

contract Keep3rSugarMommy is UtilsReady, IKeep3rSugarMommy {
  using SafeMath for uint256;
  using EnumerableSet for EnumerableSet.AddressSet;

  IKeep3rV1 public keep3r;
  address public bond;
  uint256 public minBond;
  uint256 public earned;
  uint256 public age;
  bool public onlyEOA;

  EnumerableSet.AddressSet internal _validJobs;
  address currentJob;

  constructor(
    address _keep3r,
    address _bond,
    uint256 _minBond,
    uint256 _earned,
    uint256 _age,
    bool _onlyEOA
  ) public UtilsReady() {
    setKeep3r(_keep3r);
    setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
  }

  function isKeep3rSugarMommy() external pure override returns (bool) { return true; }

  // Keep3r Setters
  function setKeep3r(address _keep3r) public override onlyGovernor {
    keep3r = IKeep3rV1(_keep3r);
    emit Keep3rSet(_keep3r);
  }
  function setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA) public override onlyGovernor {
    bond = _bond;
    minBond = _minBond;
    earned = _earned;
    age = _age;
    onlyEOA = _onlyEOA;
    emit Keep3rRequirementsSet(_bond, _minBond, _earned, _age, _onlyEOA);
  }

  // Getters
  function jobs() public view override returns (address[] memory validJobs) {
    validJobs = new address[](_validJobs.length());
    for (uint i; i < _validJobs.length(); i++) {
      validJobs[i] = _validJobs.at(i);
    }
  }

  // Keep3r-Job actions
  function start(address _keeper) external override {
    require(isValidJob(msg.sender), 'keep3rSugarMommy::start:invalid-job');
    _isKeeper(_keeper);
    currentJob = msg.sender;
    emit JobStarted(msg.sender, _keeper);
  }

  function end(address _keeper, address _credit, uint256 _amount) public override {
    require(isValidJobEnd(msg.sender), 'keep3rSugarMommy::end:invalid-job-end');
    delete currentJob;
    _paysKeeper(_keeper, _credit, _amount);
    emit JobEnded(msg.sender, _keeper);
  }

  // Governable
  function addValidJob(address _job) external onlyGovernor {
    require(!_validJobs.contains(_job), 'keep3rSugaRMommy::add-valid-job:job-already-added');
    _validJobs.add(_job);
  }
  function removeValidJob(address _job) external onlyGovernor {
    require(_validJobs.contains(_job), 'keep3rSugaRMommy::remove-valid-job:job-not-found');
    _validJobs.remove(_job);
  }

  // View helpers
  function isValidJob(address _job) internal view returns (bool) {
    return _validJobs.contains(_job);
  }
  function isValidJobEnd(address _job) internal view returns (bool) {
    return currentJob == _job;
  }

  // Internal helpers
  function _isKeeper(address _keeper) internal {
    if (onlyEOA) require(_keeper == tx.origin, "keep3rSugarMommy::isKeeper:keeper-is-not-eoa");
    if (minBond == 0 && earned == 0 && age == 0) {
      // If no custom keeper requirements are set, just evaluate if sender is a registered keeper
      require(keep3r.isKeeper(_keeper), "keep3rSugarMommy::isKeeper:keeper-is-not-registered");
    } else {
      if (bond == address(0)) {
        // Checks for min KP3R, earned and age.
        require(keep3r.isMinKeeper(_keeper, minBond, earned, age), "keep3rSugarMommy::isKeeper:keeper-not-min-requirements");
      } else {
        // Checks for min custom-bond, earned and age.
        require(keep3r.isBondedKeeper(_keeper, bond, minBond, earned, age), "keep3rSugarMommy::isKeeper:keeper-not-custom-min-requirements");
      }
    }
  }

  function _paysKeeper(address _keeper, address _credit, uint256 _amount) internal {
    if (_credit == address(0)) {
      if (_amount == 0) {
        keep3r.worked(_keeper);
      } else {
        keep3r.workReceipt(_keeper, _amount);
      }
    } else {
      if (_credit == address(ETH_ADDRESS)) {
        keep3r.receiptETH(_keeper, _amount);
      } else {
        keep3r.receipt(_credit, _keeper, _amount);
      }
    }
  }

}

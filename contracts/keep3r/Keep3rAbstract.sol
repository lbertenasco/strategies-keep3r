// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '../../interfaces/keep3r/IKeep3rV1.sol';

abstract
contract Keep3r {

  IKeep3rV1 public keep3r;
  address public bond;
  uint256 public minBond;
  uint256 public earned;
  uint256 public age;
  bool public onlyEOA;

  constructor(address _keep3r) public {
    _setKeep3r(_keep3r);
  }

  // Setters
  function _setKeep3r(address _keep3r) internal {
    keep3r = IKeep3rV1(_keep3r);
  }
  function _setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA) internal {
    bond = _bond;
    minBond = _minBond;
    earned = _earned;
    age = _age;
    onlyEOA = _onlyEOA;
  }

  // Modifiers
  // Only checks if caller is a valid keeper, payment should be handled manually
  modifier onlyKeeper() {
    _isKeeper();
    _;
  }

  // Checks if caller is a valid keeper, handles default payment after execution
  modifier paysKeeper() {
    _isKeeper();
    _;
    keep3r.worked(msg.sender);
  }
  // Checks if caller is a valid keeper, handles payment amount after execution
  modifier paysKeeperAmount(uint256 _amount) {
    _isKeeper();
    _;
    keep3r.workReceipt(msg.sender, _amount);
  }
  // Checks if caller is a valid keeper, handles payment amount in _credit after execution
  modifier paysKeeperCredit(address _credit, uint256 _amount) {
    _isKeeper();
    _;
    keep3r.receipt(_credit, msg.sender, _amount);
  }
  // Checks if caller is a valid keeper, handles payment amount in ETH after execution
  modifier paysKeeperEth(uint256 _amount) {
    _isKeeper();
    _;
    keep3r.receiptETH( msg.sender, _amount);
  }

  // Internal helpers
  function _isKeeper() internal {
    if (onlyEOA) require(msg.sender == tx.origin, "keep3r::isKeeper:keeper-is-not-eoa");
    if (minBond == 0 && earned == 0 && age == 0) {
      // If no custom keeper requirements are set, just evaluate if sender is a registered keeper
      require(keep3r.isKeeper(msg.sender), "keep3r::isKeeper:keeper-is-not-registered");
    } else {
      if (bond == address(0)) {
        // Checks for min KP3R, earned and age.
        require(keep3r.isMinKeeper(msg.sender, minBond, earned, age), "keep3r::isKeeper:keeper-not-min-requirements");
      } else {
        // Checks for min custom-bond, earned and age.
        require(keep3r.isBondedKeeper(msg.sender, bond, minBond, earned, age), "keep3r::isKeeper:keeper-not-custom-min-requirements");
      }
    }
  }
}

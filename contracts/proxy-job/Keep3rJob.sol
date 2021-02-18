// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/interfaces/utils/IGovernable.sol";

import "../../interfaces/proxy-job/IKeep3rProxyJob.sol";
import "../../interfaces/proxy-job/IKeep3rJob.sol";

abstract contract Keep3rJob is IKeep3rJob, IGovernable {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    IKeep3rProxyJob public Keep3rProxyJob;
    EnumerableSet.AddressSet internal _mechanics;

    constructor(address _keep3rProxyJob) public {
        Keep3rProxyJob = IKeep3rProxyJob(_keep3rProxyJob);
    }

    modifier onlyProxyJob() {
        require(msg.sender == address(Keep3rProxyJob), "Keep3rJob::onlyProxyJob:invalid-msg-sender");
        _;
    }

    // Governable
    function _addMechanic(address _mechanic) internal {
        require(!_mechanics.contains(_mechanic), "Keep3rJob::add-mechanic:mechanic-already-added");
        _mechanics.add(_mechanic);
        emit MechanicAdded(_mechanic);
    }

    function _removeMechanic(address _mechanic) internal {
        require(_mechanics.contains(_mechanic), "Keep3rJob::remove-mechanic:mechanic-not-found");
        _mechanics.remove(_mechanic);
        emit MechanicRemoved(_mechanic);
    }

    // View helpers
    function isMechanic(address mechanic) public view override returns (bool _isMechanic) {
        return _mechanics.contains(mechanic);
    }

    // Getters
    function mechanics() public view override returns (address[] memory _mechanicsList) {
        _mechanicsList = new address[](_mechanics.length());
        for (uint256 i; i < _mechanics.length(); i++) {
            _mechanicsList[i] = _mechanics.at(i);
        }
    }
}

// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";

import "../../interfaces/yearn/IBaseStrategy.sol";

interface IOracleKeeper {
    // Getters
    function jobs() external view returns (address[] memory);

    event JobAdded(address _job);
    event JobRemoved(address _job);

    // Setters
    function addJobs(address[] calldata _jobs) external;

    function addJob(address _job) external;

    function removeJob(address _job) external;

    // Jobs actions
    function tend(address _strategy) external;

    function harvest(address _strategy) external;
}

contract OracleKeeper is MachineryReady, IOracleKeeper {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal _validJobs;

    constructor(address _mechanicsRegistry) public MachineryReady(_mechanicsRegistry) {}

    // Setters
    function addJobs(address[] calldata _jobs) external override onlyGovernorOrMechanic {
        for (uint256 i; i < _jobs.length; i++) {
            _addJob(_jobs[i]);
        }
    }

    function addJob(address _job) external override onlyGovernorOrMechanic {
        _addJob(_job);
    }

    function _addJob(address _job) internal {
        _validJobs.add(_job);
        emit JobAdded(_job);
    }

    function removeJob(address _job) external override onlyGovernorOrMechanic {
        _validJobs.remove(_job);
        emit JobRemoved(_job);
    }

    // Getters
    function jobs() public view override returns (address[] memory _jobs) {
        _jobs = new address[](_validJobs.length());
        for (uint256 i; i < _validJobs.length(); i++) {
            _jobs[i] = _validJobs.at(i);
        }
    }

    // Jobs functions
    function tend(address _strategy) external override onlyValidJob {
        IBaseStrategy(_strategy).tend();
    }

    function harvest(address _strategy) external override onlyValidJob {
        IBaseStrategy(_strategy).harvest();
    }

    modifier onlyValidJob() {
        require(_validJobs.contains(msg.sender), "OracleKeeper::onlyValidJob:msg-sender-not-valid-job");
        _;
    }
}

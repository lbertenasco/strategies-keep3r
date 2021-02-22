// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/UtilsReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "../../proxy-job/Keep3rJob.sol";
import "../../../interfaces/jobs/v2/IV2Keeper.sol";

import "../../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";
import "../../../interfaces/yearn/IBaseStrategy.sol";

contract V2Keeper is UtilsReady, IV2Keeper {
    using SafeMath for uint256;

    EnumerableSet.AddressSet internal _v2Jobs;

    constructor() public UtilsReady() {}

    // Setters
    function addJobs(address[] calldata _jobs) external override onlyGovernor {
        for (uint256 i; i < _jobs.length; i++) {
            _addJob(_jobs[i]);
        }
    }

    function addJob(address _job) external override onlyGovernor {
        _addJob(_job);
    }

    function _addJob(address _job) internal {
        require(_v2Jobs.add(_job), "v2-keeper::add-job:job-already-added");
        emit JobAdded(_job);
    }

    function removeJob(address _job) external override onlyGovernor {
        require(_v2Jobs.remove(_job), "v2-keeper::remove-job:job-not-added");
        emit JobRemoved(_job);
    }

    // Getters
    function jobs() public view override returns (address[] memory _jobs) {
        _jobs = new address[](_v2Jobs.length());
        for (uint256 i; i < _v2Jobs.length(); i++) {
            _jobs[i] = _v2Jobs.at(i);
        }
    }

    // Modifiers
    modifier onlyV2Job() {
        require(_v2Jobs.contains(msg.sender), "v2-keeper::only-v2-job:sender-not-v2-job");
        _;
    }

    // Jobs actions
    function tend(address _strategy) external override onlyV2Job {
        IBaseStrategy(_strategy).tend();
    }

    function harvest(address _strategy) external override onlyV2Job {
        IBaseStrategy(_strategy).harvest();
    }
}

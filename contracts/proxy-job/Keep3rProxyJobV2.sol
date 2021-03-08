// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "../interfaces/proxy-job/IKeep3rProxyJobV2.sol";
import "../interfaces/proxy-job/IKeep3rJob.sol";

contract Keep3rProxyJobV2 is MachineryReady, Keep3r, IKeep3rProxyJobV2 {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal _validJobs;

    mapping(address => uint256) public override usedCredits;
    mapping(address => uint256) public override maxCredits;

    constructor(
        address _mechanicsRegistry,
        address _keep3r,
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA
    ) public MachineryReady(_mechanicsRegistry) Keep3r(_keep3r) {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
    }

    // Keep3r Setters
    function setKeep3r(address _keep3r) external override onlyGovernor {
        _setKeep3r(_keep3r);
    }

    function setKeep3rRequirements(
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA
    ) external override onlyGovernor {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
    }

    // Setters
    function addValidJob(address _job, uint256 _maxCredits) external override onlyGovernorOrMechanic {
        require(!_validJobs.contains(_job), "Keep3rProxyJob::add-valid-job:job-already-added");
        _validJobs.add(_job);
        _setJobMaxCredits(_job, _maxCredits);
        emit AddValidJob(_job, _maxCredits);
    }

    function removeValidJob(address _job) external override onlyGovernorOrMechanic {
        require(_validJobs.contains(_job), "Keep3rProxyJob::remove-valid-job:job-not-found");
        _validJobs.remove(_job);

        if (maxCredits[_job] > 0) {
            delete usedCredits[_job];
            delete maxCredits[_job];
        }
        emit RemoveValidJob(_job);
    }

    function setJobMaxCredits(address _job, uint256 _maxCredits) external override onlyGovernorOrMechanic {
        _setJobMaxCredits(_job, _maxCredits);
        emit SetJobMaxCredits(_job, _maxCredits);
    }

    function _setJobMaxCredits(address _job, uint256 _maxCredits) internal {
        usedCredits[_job] = 0;
        maxCredits[_job] = _maxCredits;
    }

    // Getters
    function jobs() public view override returns (address[] memory validJobs) {
        validJobs = new address[](_validJobs.length());
        for (uint256 i; i < _validJobs.length(); i++) {
            validJobs[i] = _validJobs.at(i);
        }
    }

    // Keep3r-Job actions
    function workable(address _job) external override notPaused returns (bool _workable) {
        require(isValidJob(_job), "Keep3rProxyJob::workable:invalid-job");
        return IKeep3rJob(_job).workable();
    }

    function work(address _job, bytes calldata _workData) external override {
        workForBond(_job, _workData);
    }

    function workForBond(address _job, bytes calldata _workData) public override notPaused updateCredits(_job) onlyKeeper paysKeeper {
        _work(_job, _workData);
    }

    function workForTokens(address _job, bytes calldata _workData)
        external
        override
        notPaused
        updateCredits(_job)
        onlyKeeper
        paysKeeperInTokens
    {
        _work(_job, _workData);
    }

    function _work(address _job, bytes calldata _workData) internal {
        require(isValidJob(_job), "Keep3rProxyJob::work:invalid-job");
        IKeep3rJob(_job).work(_workData);
        emit Worked(_job, msg.sender);
    }

    // View helpers
    function isValidJob(address _job) public view override returns (bool) {
        return _validJobs.contains(_job);
    }

    // Modifiers
    modifier updateCredits(address _job) {
        // skip check if job's maxCredits is 0 (not limited)
        if (maxCredits[_job] == 0) return;
        uint256 _beforeCredits = _Keep3r.credits(address(this), address(_Keep3r));
        _;
        uint256 _afterCredits = _Keep3r.credits(address(this), address(_Keep3r));
        usedCredits[_job] = usedCredits[_job].add(_beforeCredits.sub(_afterCredits));
        require(usedCredits[_job] <= maxCredits[_job], "Keep3rProxyJob::update-credits:used-credits-exceed-max-credits");
    }
}

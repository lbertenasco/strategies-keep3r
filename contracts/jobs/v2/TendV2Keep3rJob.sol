// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "../../proxy-job/Keep3rJob.sol";
import "../../../interfaces/jobs/v2/ITendV2Keep3rJob.sol";

import "../../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../../interfaces/yearn/IBaseStrategy.sol";
import "../../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

contract TendV2Keep3rJob is MachineryReady, Keep3rJob, ITendV2Keep3rJob {
    using SafeMath for uint256;

    address public constant KP3R = address(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    address public keep3r;
    address public keep3rHelper;
    address public slidingOracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => uint256) public requiredTend;
    mapping(address => uint256) public lastTendAt;

    uint256 public tendCooldown;

    uint256 public usedCredits;
    uint256 public maxCredits;

    constructor(
        address _keep3rProxyJob,
        address _keep3r,
        address _keep3rHelper,
        address _slidingOracle,
        uint256 _tendCooldown,
        uint256 _maxCredits
    ) public MachineryReady() Keep3rJob(_keep3rProxyJob) {
        keep3r = _keep3r;
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
        _setTendCooldown(_tendCooldown);
        _setMaxCredits(_maxCredits);
    }

    // Setters
    function setTendCooldown(uint256 _tendCooldown) external override onlyGovernor {
        _setTendCooldown(_tendCooldown);
    }

    function _setTendCooldown(uint256 _tendCooldown) internal {
        require(_tendCooldown > 0, "generic-keep3r-v2::set-tend-cooldown:should-not-be-zero");
        tendCooldown = _tendCooldown;
    }

    function setMaxCredits(uint256 _maxCredits) external override onlyGovernor {
        _setMaxCredits(_maxCredits);
    }

    function _setMaxCredits(uint256 _maxCredits) internal {
        usedCredits = 0;
        maxCredits = _maxCredits;
    }

    // Unique methods to add a strategy to the system
    // If you don't require harvest, use _requiredHarvest = 0
    // If you don't require tend, use _requiredTend = 0
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredTends) external override onlyGovernor {
        require(_strategies.length == _requiredTends.length, "generic-keep3r-v2::add-strategies:strategies-required-tends-different-length");
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredTends[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredTend) external override onlyGovernor {
        _addStrategy(_strategy, _requiredTend);
    }

    function _addStrategy(address _strategy, uint256 _requiredTend) internal {
        require(_requiredTend > 0, "generic-keep3r-v2::add-strategy:should-need-harvest-or-tend");
        _addTendStrategy(_strategy, _requiredTend);
        _availableStrategies.add(_strategy);
    }

    function _addTendStrategy(address _strategy, uint256 _requiredTend) internal {
        require(requiredTend[_strategy] == 0, "generic-keep3r-v2::add-tend-strategy:strategy-already-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyAdded(_strategy, _requiredTend);
    }

    function updateRequiredTendAmount(address _strategy, uint256 _requiredTend) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::update-required-tend:strategy-not-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyModified(_strategy, _requiredTend);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::remove-strategy:strategy-not-added");
        delete requiredTend[_strategy];
        _availableStrategies.remove(_strategy);
        emit TendStrategyRemoved(_strategy);
    }

    function _setRequiredTend(address _strategy, uint256 _requiredTend) internal {
        require(_requiredTend > 0, "generic-keep3r-v2::set-required-tend:should-not-be-zero");
        requiredTend[_strategy] = _requiredTend;
    }

    // Getters
    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](_availableStrategies.length());
        for (uint256 i; i < _availableStrategies.length(); i++) {
            _strategies[i] = _availableStrategies.at(i);
        }
    }

    // Job actions
    function getWorkData() public override returns (bytes memory _workData) {
        for (uint256 i; i < _availableStrategies.length(); i++) {
            address _strategy = _availableStrategies.at(i);
            if (_workable(_strategy)) return abi.encode(_strategy);
        }
    }

    function decodeWorkData(bytes memory _workData) public pure returns (address _strategy) {
        return abi.decode(_workData, (address));
    }

    function workable() public override returns (bool) {
        for (uint256 i; i < _availableStrategies.length(); i++) {
            if (_workable(_availableStrategies.at(i))) return true;
        }
        return false;
    }

    function _workable(address _strategy) internal view returns (bool) {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::tendable:strategy-not-added");
        if (block.timestamp > lastTendAt[_strategy].add(tendCooldown)) return false;

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredTend[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).tendTrigger(ethCallCost);
    }

    // Keep3r actions
    function work(bytes memory _workData) external override notPaused onlyProxyJob updateCredits {
        address _strategy = decodeWorkData(_workData);
        require(_workable(_strategy), "generic-keep3r-v2::work:not-workable");

        _tend(_strategy);

        emit Worked(_strategy);
    }

    // Governor keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _tend(_strategy);
        emit ForceWorked(_strategy);
    }

    function _tend(address _strategy) internal {
        IBaseStrategy(_strategy).tend();
        lastTendAt[_strategy] = block.timestamp;
    }

    modifier updateCredits() {
        uint256 _beforeCredits = IKeep3rV1(keep3r).credits(address(Keep3rProxyJob), keep3r);
        _;
        uint256 _afterCredits = IKeep3rV1(keep3r).credits(address(Keep3rProxyJob), keep3r);
        usedCredits = usedCredits.add(_beforeCredits.sub(_afterCredits));
        require(usedCredits <= maxCredits, "generic-keep3r-v2::update-credits:used-credits-exceed-max-credits");
    }
}

// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "../proxy-job/Keep3rJob.sol";
import "../../interfaces/jobs/IHarvestV2Keep3rJob.sol";

import "../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

contract HarvestV2Keep3rJob is UtilsReady, Keep3rJob, IHarvestV2Keep3rJob {
    using SafeMath for uint256;

    address public constant KP3R = address(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    address public keep3r;
    address public keep3rHelper;
    address public slidingOracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => uint256) public requiredHarvest;
    mapping(address => uint256) public lastHarvestAt;

    uint256 public harvestCooldown;

    uint256 public usedCredits;
    uint256 public maxCredits;

    constructor(
        address _keep3rProxyJob,
        address _keep3r,
        address _keep3rHelper,
        address _slidingOracle,
        uint256 _harvestCooldown,
        uint256 _maxCredits
    ) public UtilsReady() Keep3rJob(_keep3rProxyJob) {
        keep3r = _keep3r;
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
        _setHarvestCooldown(_harvestCooldown);
        _setMaxCredits(_maxCredits);
    }

    // Setters
    function setHarvestCooldown(uint256 _harvestCooldown) external override onlyGovernor {
        _setHarvestCooldown(_harvestCooldown);
    }

    function _setHarvestCooldown(uint256 _harvestCooldown) internal {
        require(_harvestCooldown > 0, "HarvestV2Keep3rJob::set-harvest-cooldown:should-not-be-zero");
        harvestCooldown = _harvestCooldown;
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
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external override onlyGovernor {
        require(
            _strategies.length == _requiredHarvests.length,
            "HarvestV2Keep3rJob::add-strategies:strategies-required-harvests-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredHarvests[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        _addStrategy(_strategy, _requiredHarvest);
    }

    function _addStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "HarvestV2Keep3rJob::add-strategy:harvest-should-not-be-0");
        _addHarvestStrategy(_strategy, _requiredHarvest);
        _availableStrategies.add(_strategy);
    }

    function _addHarvestStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "HarvestV2Keep3rJob::add-harvest-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyAdded(_strategy, _requiredHarvest);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "HarvestV2Keep3rJob::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyModified(_strategy, _requiredHarvest);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "HarvestV2Keep3rJob::remove-strategy:strategy-not-added");
        delete requiredHarvest[_strategy];
        _availableStrategies.remove(_strategy);
        emit HarvestStrategyRemoved(_strategy);
    }

    function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "HarvestV2Keep3rJob::set-required-harvest:should-not-be-zero");
        requiredHarvest[_strategy] = _requiredHarvest;
    }

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
        require(requiredHarvest[_strategy] > 0, "HarvestV2Keep3rJob::harvestable:strategy-not-added");
        if (block.timestamp > lastHarvestAt[_strategy].add(harvestCooldown)) return false;

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredHarvest[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).harvestTrigger(ethCallCost);
    }

    // Keep3r actions
    function work(bytes memory _workData) external override notPaused onlyProxyJob updateCredits {
        address _strategy = decodeWorkData(_workData);

        require(_workable(_strategy), "HarvestV2Keep3rJob::harvest:not-workable");

        _harvest(_strategy);

        emit Worked(_strategy);
    }

    // Governor keeper bypass
    function forceWork(address _strategy) external override onlyGovernor {
        _harvest(_strategy);
        emit ForceWorked(_strategy);
    }

    function _harvest(address _strategy) internal {
        IBaseStrategy(_strategy).harvest();
        lastHarvestAt[_strategy] = block.timestamp;
    }

    modifier updateCredits() {
        uint256 _beforeCredits = IKeep3rV1(keep3r).credits(address(Keep3rProxyJob), keep3r);
        _;
        uint256 _afterCredits = IKeep3rV1(keep3r).credits(address(Keep3rProxyJob), keep3r);
        usedCredits = usedCredits.add(_beforeCredits.sub(_afterCredits));
        require(usedCredits <= maxCredits, "HarvestV2Keep3rJob::update-credits:used-credits-exceed-max-credits");
    }
}

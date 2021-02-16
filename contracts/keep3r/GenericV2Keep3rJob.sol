// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "../sugar-mommy/Keep3rJob.sol";

import "../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";
import "../../interfaces/keep3r/IGenericV2Keep3rJob.sol";

contract GenericV2Keep3rJob is UtilsReady, Keep3rJob, IGenericV2Keep3rJob {
    using SafeMath for uint256;

    address public constant KP3R = address(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    address public keep3r;
    address public keep3rHelper;
    address public slidingOracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => uint256) public requiredHarvest;
    mapping(address => uint256) public requiredTend;

    mapping(address => uint256) public lastHarvestAt;
    mapping(address => uint256) public lastTendAt;

    uint256 public harvestCooldown;
    uint256 public tendCooldown;

    uint256 public usedCredits;
    uint256 public maxCredits;

    constructor(
        address _keep3rSugarMommy,
        address _keep3r,
        address _keep3rHelper,
        address _slidingOracle,
        uint256 _harvestCooldown,
        uint256 _tendCooldown,
        uint256 _maxCredits
    ) public UtilsReady() Keep3rJob(_keep3rSugarMommy) {
        keep3r = _keep3r;
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
        _setHarvestCooldown(_harvestCooldown);
        _setTendCooldown(_tendCooldown);
        _setMaxCredits(_maxCredits);
    }

    // Setters
    function setHarvestCooldown(uint256 _harvestCooldown) external override onlyGovernor {
        _setHarvestCooldown(_harvestCooldown);
    }

    function _setHarvestCooldown(uint256 _harvestCooldown) internal {
        require(_harvestCooldown > 0, "generic-keep3r-v2::set-harvest-cooldown:should-not-be-zero");
        harvestCooldown = _harvestCooldown;
    }

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
    function addStrategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredHarvests,
        uint256[] calldata _requiredTends
    ) external override onlyGovernor {
        require(
            _strategies.length == _requiredHarvests.length && _strategies.length == _requiredTends.length,
            "generic-keep3r-v2::add-strategies:strategies-required-harvests-and-tends-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredHarvests[i], _requiredTends[i]);
        }
    }

    function addStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredTend
    ) external override onlyGovernor {
        _addStrategy(_strategy, _requiredHarvest, _requiredTend);
    }

    function _addStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredTend
    ) internal {
        require(_requiredHarvest > 0 || _requiredTend > 0, "generic-keep3r-v2::add-strategy:should-need-harvest-or-tend");
        if (_requiredHarvest > 0) {
            _addHarvestStrategy(_strategy, _requiredHarvest);
        }

        if (_requiredTend > 0) {
            _addTendStrategy(_strategy, _requiredTend);
        }

        _availableStrategies.add(_strategy);
    }

    function _addHarvestStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "generic-keep3r-v2::add-harvest-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyAdded(_strategy, _requiredHarvest);
    }

    function _addTendStrategy(address _strategy, uint256 _requiredTend) internal {
        require(requiredTend[_strategy] == 0, "generic-keep3r-v2::add-tend-strategy:strategy-already-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyAdded(_strategy, _requiredTend);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyModified(_strategy, _requiredHarvest);
    }

    function updateRequiredTendAmount(address _strategy, uint256 _requiredTend) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::update-required-tend:strategy-not-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyModified(_strategy, _requiredTend);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0 || requiredTend[_strategy] > 0, "generic-keep3r-v2::remove-strategy:strategy-not-added");
        delete requiredHarvest[_strategy];
        delete requiredTend[_strategy];
        _availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function removeHarvestStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::remove-harvest-strategy:strategy-not-added");
        delete requiredHarvest[_strategy];

        if (requiredTend[_strategy] == 0) {
            _availableStrategies.remove(_strategy);
        }

        emit HarvestStrategyRemoved(_strategy);
    }

    function removeTendStrategy(address _strategy) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::remove-tend-strategy:strategy-not-added");
        delete requiredTend[_strategy];

        if (requiredHarvest[_strategy] == 0) {
            _availableStrategies.remove(_strategy);
        }

        emit TendStrategyRemoved(_strategy);
    }

    function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "generic-keep3r-v2::set-required-harvest:should-not-be-zero");
        requiredHarvest[_strategy] = _requiredHarvest;
    }

    function _setRequiredTend(address _strategy, uint256 _requiredTend) internal {
        require(_requiredTend > 0, "generic-keep3r-v2::set-required-tend:should-not-be-zero");
        requiredTend[_strategy] = _requiredTend;
    }

    // Getters
    function name() external pure override returns (string memory) {
        return "Generic Vault V2 Strategy Keep3r";
    }

    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](_availableStrategies.length());
        for (uint256 i; i < _availableStrategies.length(); i++) {
            _strategies[i] = _availableStrategies.at(i);
        }
    }

    function harvestable(address _strategy) public view override returns (bool) {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::harvestable:strategy-not-added");
        require(block.timestamp > lastHarvestAt[_strategy].add(harvestCooldown), "generic-keep3r-v2::harvestable:strategy-harvest-cooldown");

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredHarvest[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).harvestTrigger(ethCallCost);
    }

    function tendable(address _strategy) public view override returns (bool) {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::tendable:strategy-not-added");
        require(block.timestamp > lastTendAt[_strategy].add(tendCooldown), "generic-keep3r-v2::tendable:strategy-tend-cooldown");

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredTend[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).tendTrigger(ethCallCost);
    }

    // Keep3r actions
    function harvest(address _strategy) external override updateCredits {
        require(harvestable(_strategy), "generic-keep3r-v2::harvest:not-workable");

        _startJob(msg.sender);
        _harvest(_strategy);
        _endJob(msg.sender);

        emit HarvestedByKeeper(_strategy);
    }

    function tend(address _strategy) external override updateCredits {
        require(tendable(_strategy), "generic-keep3r-v2::tend:not-workable");

        _startJob(msg.sender);
        _tend(_strategy);
        _endJob(msg.sender);

        emit TendedByKeeper(_strategy);
    }

    // Governor keeper bypass
    function forceHarvest(address _strategy) external override onlyGovernor {
        _harvest(_strategy);
        emit HarvestedByGovernor(_strategy);
    }

    function forceTend(address _strategy) external override onlyGovernor {
        _tend(_strategy);
        emit TendedByGovernor(_strategy);
    }

    function _harvest(address _strategy) internal {
        IBaseStrategy(_strategy).harvest();
        lastHarvestAt[_strategy] = block.timestamp;
    }

    function _tend(address _strategy) internal {
        IBaseStrategy(_strategy).tend();
        lastTendAt[_strategy] = block.timestamp;
    }

    modifier updateCredits() {
        uint256 _beforeCredits = IKeep3rV1(keep3r).credits(address(Keep3rSugarMommy), keep3r);
        _;
        uint256 _afterCredits = IKeep3rV1(keep3r).credits(address(Keep3rSugarMommy), keep3r);
        usedCredits = usedCredits.add(_beforeCredits.sub(_afterCredits));
        require(usedCredits <= maxCredits, "generic-keep3r-v2::update-credits:used-credits-exceed-max-credits");
    }
}

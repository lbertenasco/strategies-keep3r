// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1Helper.sol";

import "../../proxy-job/Keep3rJob.sol";
import "../../interfaces/jobs/v2/IV2Keeper.sol";

import "../../interfaces/jobs/v2/IV2Keep3rJob.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

abstract contract V2Keep3rJob is MachineryReady, Keep3rJob, IV2Keep3rJob {
    using SafeMath for uint256;

    address public constant KP3R = address(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    IV2Keeper public V2Keeper;
    address public keep3rHelper;
    address public slidingOracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => uint256) public requiredAmount;
    mapping(address => uint256) public lastWorkAt;

    uint256 public workCooldown;

    constructor(
        address _mechanicsRegistry,
        address _keep3rProxyJob,
        address _v2Keeper,
        address _keep3r,
        address _keep3rHelper,
        address _slidingOracle,
        uint256 _workCooldown
    ) public MachineryReady(_mechanicsRegistry) Keep3rJob(_keep3rProxyJob) {
        V2Keeper = IV2Keeper(_v2Keeper);
        keep3r = _keep3r;
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
        if (_workCooldown > 0) _setWorkCooldown(_workCooldown);
    }

    // Setters
    function setWorkCooldown(uint256 _workCooldown) external override onlyGovernorOrMechanic {
        _setWorkCooldown(_workCooldown);
    }

    function _setWorkCooldown(uint256 _workCooldown) internal {
        require(_workCooldown > 0, "V2Keep3rJob::set-work-cooldown:should-not-be-zero");
        workCooldown = _workCooldown;
    }

    // Governor
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredAmounts) external override onlyGovernorOrMechanic {
        require(_strategies.length == _requiredAmounts.length, "V2Keep3rJob::add-strategies:strategies-required-amounts-different-length");
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredAmounts[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredAmount) external override onlyGovernorOrMechanic {
        _addStrategy(_strategy, _requiredAmount);
    }

    function _addStrategy(address _strategy, uint256 _requiredAmount) internal {
        require(_requiredAmount > 0, "V2Keep3rJob::add-strategy:required-amount-not-0");
        require(requiredAmount[_strategy] == 0, "V2Keep3rJob::add-strategy:strategy-already-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        emit StrategyAdded(_strategy, _requiredAmount);
        _availableStrategies.add(_strategy);
    }

    function updateRequiredAmounts(address[] calldata _strategies, uint256[] calldata _requiredAmounts)
        external
        override
        onlyGovernorOrMechanic
    {
        require(_strategies.length == _requiredAmounts.length, "V2Keep3rJob::update-strategies:strategies-required-amounts-different-length");
        for (uint256 i; i < _strategies.length; i++) {
            _updateRequiredAmount(_strategies[i], _requiredAmounts[i]);
        }
    }

    function updateRequiredAmount(address _strategy, uint256 _requiredAmount) external override onlyGovernorOrMechanic {
        _updateRequiredAmount(_strategy, _requiredAmount);
    }

    function _updateRequiredAmount(address _strategy, uint256 _requiredAmount) internal {
        require(requiredAmount[_strategy] > 0, "V2Keep3rJob::update-required-amount:strategy-not-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        emit StrategyModified(_strategy, _requiredAmount);
    }

    function removeStrategy(address _strategy) external override onlyGovernorOrMechanic {
        require(requiredAmount[_strategy] > 0, "V2Keep3rJob::remove-strategy:strategy-not-added");
        delete requiredAmount[_strategy];
        _availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function _setRequiredAmount(address _strategy, uint256 _requiredAmount) internal {
        require(_requiredAmount > 0, "V2Keep3rJob::set-required-work:should-not-be-zero");
        requiredAmount[_strategy] = _requiredAmount;
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

    function workable() public override notPaused returns (bool) {
        for (uint256 i; i < _availableStrategies.length(); i++) {
            if (_workable(_availableStrategies.at(i))) return true;
        }
        return false;
    }

    function _workable(address _strategy) internal view virtual returns (bool) {
        require(requiredAmount[_strategy] > 0, "V2Keep3rJob::workable:strategy-not-added");
        if (workCooldown == 0 || block.timestamp > lastWorkAt[_strategy].add(workCooldown)) return true;
        return false;
    }

    // Get eth costs
    function _getCallCosts(address _strategy) internal view returns (uint256 _kp3rCallCost, uint256 _ethCallCost) {
        _kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredAmount[_strategy]);
        _ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, _kp3rCallCost, WETH);
    }

    // Keep3r actions
    function _workInternal(bytes memory _workData) internal {
        address _strategy = decodeWorkData(_workData);
        require(_workable(_strategy), "V2Keep3rJob::work:not-workable");

        _work(_strategy);

        emit Worked(_strategy);
    }

    // Mechanics keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _work(_strategy);
        emit ForceWorked(_strategy);
    }

    function _work(address _strategy) internal virtual {}
}

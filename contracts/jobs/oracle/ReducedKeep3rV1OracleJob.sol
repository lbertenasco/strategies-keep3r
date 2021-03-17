// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/UtilsReady.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";
import "../../utils/GasPriceLimited.sol";

import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";
import "../../interfaces/jobs/IKeep3rJob.sol";

interface IReducedKeep3rV1OracleJob is IKeep3rJob {
    event PairAdded(address _pair);
    event PairRemoved(address _pair);

    // Actions by Keeper
    event Worked(address _pair, address _keeper, uint256 _credits, bool _workForTokens);

    // Actions forced by Governor
    event ForceWorked(address _pair);

    // Setters
    function addPairs(address[] calldata _pairs) external;

    function addPair(address _pair) external;

    function removePair(address _pair) external;

    // Getters
    function keep3rV1Oracle() external returns (address _keep3rV1Oracle);

    function workable(address _pair) external returns (bool);

    function pairs() external view returns (address[] memory _pairs);

    // Keeper actions
    function work(address _pair) external returns (uint256 _credits);

    function workForBond(address _pair) external returns (uint256 _credits);

    function workForTokens(address _pair) external returns (uint256 _credits);

    // Mechanics keeper bypass
    function forceWork(address _pair) external;
}

contract ReducedKeep3rV1OracleJob is UtilsReady, Keep3r, IReducedKeep3rV1OracleJob {
    using SafeMath for uint256;

    uint256 public constant PRECISION = 1_000;
    uint256 public constant MAX_REWARD_MULTIPLIER = 1 * PRECISION; // 1x max reward multiplier
    uint256 public override rewardMultiplier;

    mapping(address => uint256) public lastEarnAt;
    uint256 public earnCooldown;
    EnumerableSet.AddressSet internal _availablePairs;

    address public immutable override keep3rV1Oracle;

    constructor(
        address _keep3r,
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA,
        address _keep3rV1Oracle
    ) public UtilsReady() Keep3r(_keep3r) {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
        keep3rV1Oracle = _keep3rV1Oracle;
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

    function setRewardMultiplier(uint256 _rewardMultiplier) external override onlyGovernor {
        _setRewardMultiplier(_rewardMultiplier);
        emit SetRewardMultiplier(_rewardMultiplier);
    }

    function _setRewardMultiplier(uint256 _rewardMultiplier) internal {
        require(_rewardMultiplier <= MAX_REWARD_MULTIPLIER, "ReducedKeep3rV1OracleJob::set-reward-multiplier:multiplier-exceeds-max");
        rewardMultiplier = _rewardMultiplier;
    }

    // Setters
    function addPairs(address[] calldata _pairs) external override onlyGovernor {
        for (uint256 i; i < _pairs.length; i++) {
            _addPair(_pairs[i]);
        }
    }

    function addPair(address _pair) external override onlyGovernor {
        _addPair(_pair);
    }

    function _addPair(address _pair) internal {
        require(!_availablePairs.contains(_pair), "ReducedKeep3rV1OracleJob::add-pair:pair-already-added");
        _availablePairs.add(_pair);
        emit PairAdded(_pair);
    }

    function removePair(address _pair) external override onlyGovernor {
        require(_availablePairs.contains(_pair), "ReducedKeep3rV1OracleJob::remove-pair:pair-not-found");
        _availablePairs.remove(_pair);
        emit PairRemoved(_pair);
    }

    // Getters
    function pairs() public view override returns (address[] memory _pairs) {
        _pairs = new address[](_availablePairs.length());
        for (uint256 i; i < _availablePairs.length(); i++) {
            _pairs[i] = _availablePairs.at(i);
        }
    }

    // Keeper view actions
    function workable(address _pair) external override notPaused returns (bool) {
        return _workable(_pair);
    }

    function _workable(address _pair) internal view returns (bool) {
        require(_availablePairs.contains(_pair), "ReducedKeep3rV1OracleJob::workable:pair-not-found");
        return IUniswapV2SlidingOracle(keep3rV1Oracle).workable(_pair);
    }

    // Keeper actions
    function _work(address _pair, bool _workForTokens) internal returns (uint256 _credits) {
        uint256 _initialGas = gasleft();

        require(_workable(_pair), "ReducedKeep3rV1OracleJob::earn:not-workable");

        _updatePair(_pair);

        _credits = _calculateCredits(_initialGas);

        emit Worked(_pair, msg.sender, _credits, _workForTokens);
    }

    function work(address _pair) external override returns (uint256 _credits) {
        return workForBond(_pair);
    }

    function workForBond(address _pair) public override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _work(_pair, false);
        _paysKeeperAmount(msg.sender, _credits);
    }

    function workForTokens(address _pair) external override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _work(_pair, true);
        _paysKeeperInTokens(msg.sender, _credits);
    }

    function _calculateCredits(uint256 _initialGas) internal view returns (uint256 _credits) {
        // Gets default credits from KP3R_Helper and applies job reward multiplier
        return _getQuoteLimit(_initialGas).mul(rewardMultiplier).div(PRECISION);
    }

    // Mechanics keeper bypass
    function forceWork(address _pair) external override onlyGovernor {
        _updatePair(_pair);
        emit ForceWorked(_pair);
    }

    function _updatePair(address _pair) internal {
        IUniswapV2SlidingOracle(keep3rV1Oracle).updatePair(_pair);
    }
}

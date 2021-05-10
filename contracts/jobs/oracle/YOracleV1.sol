// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/UtilsReady.sol";

import "../../interfaces/oracle/IYOracleV1.sol";
import "../../interfaces/keep3r/IKeep3rV2OracleFactory.sol";

contract YOracleV1 is UtilsReady, IYOracleV1 {
    address public oracle;

    constructor(address _oracle) public UtilsReady() {
        _setOracle(_oracle);
    }

    function setOracle(address _oracle) external override onlyGovernor {
        _setOracle(_oracle);
    }

    function _setOracle(address _oracle) internal {
        oracle = _oracle;
    }

    function current(
        address _pair,
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) external view override returns (uint256 _amountOut) {
        (_amountOut, ) = IKeep3rV2OracleFactory(oracle).current(_pair, _tokenIn, _amountIn, _tokenOut);
    }
}

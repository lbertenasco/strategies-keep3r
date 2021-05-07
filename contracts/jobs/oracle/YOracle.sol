// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";

import "../../interfaces/yearn/IYOracle.sol";
import "../../interfaces/keep3r/IKeep3rV2OracleFactory.sol";

contract YOracleV1 is MachineryReady, IYOracle {
    address public oracle;

    constructor(address _mechanicsRegistry) public MachineryReady(_mechanicsRegistry) {}

    function setOracle(address _oracle) external override onlyGovernor {
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

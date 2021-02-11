// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "./Keep3rEscrowParameters.sol";

interface IKeep3rLiquidtyHandler {
    event LiquidityAddedToJob(address _liquidity, address _job, uint256 _amount);
    event LiquidityRemovedFromJob(address _liquidity, address _job);
    event LiquidityUnbondedFromJob(address _liquidity, address _job, uint256 _amount);

    function addLiquidityToJob(
        address _liquidity,
        address _job,
        uint256 _amount
    ) external;

    function removeLiquidityFromJob(address _liquidity, address _job) external;

    function unbondLiquidityFromJob(
        address _liquidity,
        address _job,
        uint256 _amount
    ) external;
}

abstract contract Keep3rLiquidtyHandler is Keep3rEscrowParameters, IKeep3rLiquidtyHandler {
    constructor(
        address _governance,
        IKeep3rV1 _keep3r,
        IERC20 _lpToken
    ) public Keep3rEscrowParameters(_governance, _keep3r, _lpToken) {}

    function _addLiquidityToJob(
        address _liquidity,
        address _job,
        uint256 _amount
    ) internal {
        lpToken.approve(address(keep3rV1), _amount);
        keep3rV1.addLiquidityToJob(_liquidity, _job, _amount);
    }

    function _removeLiquidityFromJob(address _liquidity, address _job) internal {
        keep3rV1.removeLiquidityFromJob(_liquidity, _job);
    }

    function _unbondLiquidityFromJob(
        address _liquidity,
        address _job,
        uint256 _amount
    ) internal {
        keep3rV1.unbondLiquidityFromJob(_liquidity, _job, _amount);
    }
}

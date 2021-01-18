// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol';
import '@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol';

import '../../interfaces/keep3r/IKeep3rEscrow.sol';

contract Keep3rEscrow is UtilsReady, IKeep3rEscrow {
    using SafeMath for uint256;

    IKeep3rV1 Keep3rV1;
    address governance;
    address lpTokens;

    constructor(address _keep3r, address _governance, address _lpTokens) public UtilsReady() { 
        Keep3rV1 = IKeep3rV1(_keep3r);
        governance = _governance;
        lpTokens = _lpTokens;
        _addProtocolToken(_lpTokens);
    }

    function isKeep3rEscrow() external pure override returns (bool) { return true; }


    function returnLPsToGovernance() external onlyGovernor {
        IERC20(lpTokens).transfer(governance, IERC20(lpTokens).balanceOf(address(this)));
    }

    function addLiquidityToJob(address liquidity, address job, uint amount) external onlyGovernor {
        Keep3rV1.addLiquidityToJob(liquidity, job, amount);
    }

    function applyCreditToJob(address provider, address liquidity, address job) external onlyGovernor {
        Keep3rV1.applyCreditToJob(provider, liquidity, job);
    }

    function unbondLiquidityFromJob(address liquidity, address job, uint amount) external onlyGovernor {
        Keep3rV1.unbondLiquidityFromJob(liquidity, job, amount);
    }

    function removeLiquidityFromJob(address liquidity, address job) external onlyGovernor {
        Keep3rV1.removeLiquidityFromJob(liquidity, job);
    }

}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./StrategyCurveYVoterProxyAbstract.sol";
/*
 * MockStrategy 
 */

contract MockStrategy is StrategyCurveYVoterProxy {
    using SafeMath for uint256;

    constructor(address _controller) public StrategyCurveYVoterProxy(_controller) {
    }

    function harvest() public override {
        require(msg.sender == strategist || msg.sender == governance, "!authorized");
        
        uint256 _crv = IERC20(crv).balanceOf(address(this));
        if (_crv > 0) {
        
            // Replaces this code below:

            IERC20(crv).safeApprove(uni, 0);
            IERC20(crv).safeApprove(uni, _crv);

            address[] memory path = new address[](3);
            path[0] = crv;
            path[1] = weth;
            path[2] = dai;

            Uni(uni).swapExactTokensForTokens(_crv, uint256(0), path, address(this), now.add(1800));
        }
    }

}
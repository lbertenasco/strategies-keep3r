// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IKeep3rV1 {
    function name() external returns (string memory);
    function isKeeper(address _keeper) external returns (bool);
    function isMinKeeper(address _keeper, uint256 _minBond, uint256 _earned, uint256 _age) external returns (bool);
    function isBondedKeeper(address _keeper, address bond, uint256 _minBond, uint256 _earned, uint256 _age) external returns (bool);
    function addKPRCredit(address _job, uint256 _amount) external;
    function addJob(address _job) external;

    function worked(address _keeper) external;
    function workReceipt(address _keeper, uint256 _amount) external;
    function receipt(address credit, address _keeper, uint256 _amount) external;
    function receiptETH(address _keeper, uint256 _amount) external;

    function addLiquidityToJob(address liquidity, address job, uint amount) external;
    function applyCreditToJob(address provider, address liquidity, address job) external;
    function unbondLiquidityFromJob(address liquidity, address job, uint amount) external;
    function removeLiquidityFromJob(address liquidity, address job) external;

    function credits(address _job, address _credit) external view returns (uint256 _amount);
}

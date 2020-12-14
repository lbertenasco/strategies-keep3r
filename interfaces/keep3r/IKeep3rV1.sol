// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IKeep3rV1 {
    function name() external returns (string memory);
    function isKeeper(address keeper) external returns (bool);
    function isMinKeeper(address keeper, uint minBond, uint earned, uint age) external returns (bool);
    function isBondedKeeper(address keeper, address bond, uint minBond, uint earned, uint age) external returns (bool);
    function addKPRCredit(address job, uint amount) external;
    function addJob(address job) external;

    function worked(address keeper) external;
    function workReceipt(address keeper, uint amount) external;
    function receipt(address credit, address keeper, uint amount) external;
    function receiptETH(address keeper, uint amount) external;
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface ITendV2Keep3rJob {
    event Keep3rSet(address keep3r);
    event Keep3rHelperSet(address keep3rHelper);
    event SlidingOracleSet(address slidingOracle);

    // Actions by Keeper
    event Worked(address _strategy);
    // Actions forced by governor
    event ForceWorked(address _strategy);

    // Getters
    function strategies() external view returns (address[] memory);

    event TendStrategyAdded(address _strategy, uint256 _requiredTend);

    event TendStrategyModified(address _strategy, uint256 _requiredTend);

    event TendStrategyRemoved(address _strategy);

    // Setters
    function setTendCooldown(uint256 _tendCooldown) external;

    function setMaxCredits(uint256 _maxCredits) external;

    function addStrategies(address[] calldata _strategy, uint256[] calldata _requiredTend) external;

    function addStrategy(address _strategy, uint256 _requiredTend) external;

    function updateRequiredTendAmount(address _strategy, uint256 _requiredTend) external;

    function removeStrategy(address _strategy) external;

    // Governor work bypass
    function forceWork(address _strategy) external;
}

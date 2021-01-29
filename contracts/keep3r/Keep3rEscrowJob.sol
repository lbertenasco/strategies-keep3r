// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol';
import '@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol';

import '../sugar-mommy/Keep3rJob.sol';

import '../../interfaces/keep3r/IKeep3rEscrowJob.sol';
import '../../interfaces/keep3r/IKeep3rEscrow.sol';

contract Keep3rEscrowJob is UtilsReady, Keep3rJob, IKeep3rEscrowJob {
    using SafeMath for uint256;

    IKeep3rV1 public Keep3rV1;
    IERC20 public Liquidity;

    IKeep3rEscrow public Escrow1;
    IKeep3rEscrow public Escrow2;

    constructor(
        address _keep3r,
        address _keep3rSugarMommy,
        address _liquidity,
        address _escrow1,
        address _escrow2
    ) public UtilsReady() Keep3rJob(_keep3rSugarMommy) {
        Keep3rV1 = IKeep3rV1(_keep3r);
        Liquidity = IERC20(_liquidity);
        Escrow1 = IKeep3rEscrow(_escrow1);
        Escrow2 = IKeep3rEscrow(_escrow2);
        require(Escrow1.isKeep3rEscrow(), 'escrow1-is-no-Keep3rEscrowJob');
        require(Escrow2.isKeep3rEscrow(), 'escrow2-is-no-Keep3rEscrowJob');
    }

    function isKeep3rEscrowJob() external pure override returns (bool) { return true; }

    // Keep3rV1 Escrow helper
    function getNextAction() public view override returns (IKeep3rEscrow Escrow, Actions _action) {
        uint256 liquidityProvided1 = Keep3rV1.liquidityProvided(address(Escrow1), address(Liquidity), address(Keep3rSugarMommy));
        uint256 liquidityProvided2 = Keep3rV1.liquidityProvided(address(Escrow2), address(Liquidity), address(Keep3rSugarMommy));
        if (liquidityProvided1 == 0 && liquidityProvided2 == 0) {
            // Only start if both escrow have liquidity
            require(Liquidity.balanceOf(address(Escrow1)) > 0, 'Keep3rEscrowJob::getNextAction:Escrow1-liquidity-is-0');
            require(Liquidity.balanceOf(address(Escrow2)) > 0, 'Keep3rEscrowJob::getNextAction:Escrow2-liquidity-is-0');
            
            // Start by addLiquidityToJob liquidity with Escrow1 as default
            return (Escrow1, Actions.addLiquidityToJob);
        }


        // The escrow with liquidityAmount is the one to call applyCreditToJob, the other should call unbondLiquidityFromJob
        if (Keep3rV1.liquidityAmount(address(Escrow1), address(Liquidity), address(Keep3rSugarMommy)) > 0 &&
            Keep3rV1.liquidityApplied(address(Escrow1), address(Liquidity), address(Keep3rSugarMommy)) < now) {
            return (Escrow1, Actions.applyCreditToJob);
        }
        if (Keep3rV1.liquidityAmount(address(Escrow2), address(Liquidity), address(Keep3rSugarMommy)) > 0 &&
            Keep3rV1.liquidityApplied(address(Escrow2), address(Liquidity), address(Keep3rSugarMommy)) < now) {
            return (Escrow2, Actions.applyCreditToJob);
        }


        // Check if we can removeLiquidityFromJob & instantly addLiquidityToJob
        uint256 liquidityAmountsUnbonding1 = Keep3rV1.liquidityAmountsUnbonding(address(Escrow1), address(Liquidity), address(Keep3rSugarMommy));
        uint256 liquidityUnbonding1 = Keep3rV1.liquidityUnbonding(address(Escrow1), address(Liquidity), address(Keep3rSugarMommy));
        if (liquidityAmountsUnbonding1 > 0 && liquidityUnbonding1 < now) {
            return (Escrow1, Actions.removeLiquidityFromJob);
        }
        uint256 liquidityAmountsUnbonding2 = Keep3rV1.liquidityAmountsUnbonding(address(Escrow2), address(Liquidity), address(Keep3rSugarMommy));
        uint256 liquidityUnbonding2 = Keep3rV1.liquidityUnbonding(address(Escrow2), address(Liquidity), address(Keep3rSugarMommy));
        if (liquidityAmountsUnbonding2 > 0 && liquidityUnbonding2 < now) {
            return (Escrow2, Actions.removeLiquidityFromJob);
        }

        return (IKeep3rEscrow(0), Actions.none);
    }

    // Keep3r actions
    function workable() public view override notPaused returns (bool) {
        (, Actions _action) = getNextAction();
        return _workable(_action);
    }
    function _workable(Actions _action) internal pure returns (bool) {
        return (_action != Actions.none);
    }

    function work() external override notPaused {
        (IKeep3rEscrow Escrow, Actions _action) = getNextAction();
        require(_workable(_action), 'Keep3rEscrowJob::work:not-workable');

        _startJob(msg.sender);

        _work(Escrow, _action);

        _endJob(msg.sender);
        emit WorkByKeeper();
    }


    function _work(IKeep3rEscrow Escrow, Actions _action) internal {
        if (_action == Actions.addLiquidityToJob) {
            uint256 _amount = Liquidity.balanceOf(address(Escrow));
            Escrow.addLiquidityToJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
            return;
        }
    
        if (_action == Actions.applyCreditToJob) {
            IKeep3rEscrow OtherEscrow = address(Escrow) == address(Escrow1) ? Escrow2 : Escrow1;

            // ALWAYS FIRST: Should try to unbondLiquidityFromJob from OtherEscrow
            uint256 _liquidityProvided = Keep3rV1.liquidityProvided(address(OtherEscrow), address(Liquidity), address(Keep3rSugarMommy));
            uint256 _liquidityAmount = Keep3rV1.liquidityAmount(address(OtherEscrow), address(Liquidity), address(Keep3rSugarMommy));
            if (_liquidityProvided > 0 && _liquidityAmount == 0) {
                OtherEscrow.unbondLiquidityFromJob(address(Liquidity), address(Keep3rSugarMommy), _liquidityProvided);
            } else {
            //  - if can't unbound then addLiquidity
                uint256 _amount = Liquidity.balanceOf(address(OtherEscrow));
                if (_amount > 0) {
                    OtherEscrow.addLiquidityToJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
                } else {
            //      - if no liquidity to add and liquidityAmountsUnbonding then removeLiquidityFromJob + addLiquidityToJob
                    uint256 _liquidityAmountsUnbonding = Keep3rV1.liquidityAmountsUnbonding(address(OtherEscrow), address(Liquidity), address(Keep3rSugarMommy));
                    uint256 _liquidityUnbonding = Keep3rV1.liquidityUnbonding(address(OtherEscrow), address(Liquidity), address(Keep3rSugarMommy));
                    if (_liquidityAmountsUnbonding > 0 && _liquidityUnbonding < now) {
                        OtherEscrow.removeLiquidityFromJob(address(Liquidity), address(Keep3rSugarMommy));
                        _amount = Liquidity.balanceOf(address(OtherEscrow));
                        OtherEscrow.addLiquidityToJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
                    }
                }
            }


            // Run applyCreditToJob
            Escrow.applyCreditToJob(address(Escrow), address(Liquidity), address(Keep3rSugarMommy));
            return;
        }

        if (_action == Actions.removeLiquidityFromJob) {
            Escrow.removeLiquidityFromJob(address(Liquidity), address(Keep3rSugarMommy));
            uint256 _amount = Liquidity.balanceOf(address(Escrow));
            Escrow.addLiquidityToJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
            return;
        }

    }


    // Governor escrow bypass
    function forceWork() external override onlyGovernor {
        (IKeep3rEscrow Escrow, Actions _action) = getNextAction();
        _work(Escrow, _action);
        emit WorkByGovernor();
    }

    function returnLPsToGovernance(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::returnLPsToGovernance:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.returnLPsToGovernance();
    }

    function addLiquidityToJob(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::addLiquidityToJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        uint256 _amount = Liquidity.balanceOf(address(Escrow));
        Escrow.addLiquidityToJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
    }

    function applyCreditToJob(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::applyCreditToJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.applyCreditToJob(address(Escrow), address(Liquidity), address(Keep3rSugarMommy));
    }

    function unbondLiquidityFromJob(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::unbondLiquidityFromJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        uint256 _amount = Keep3rV1.liquidityProvided(address(Escrow), address(Liquidity), address(Keep3rSugarMommy));
        Escrow.unbondLiquidityFromJob(address(Liquidity), address(Keep3rSugarMommy), _amount);
    }

    function removeLiquidityFromJob(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::removeLiquidityFromJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.removeLiquidityFromJob(address(Liquidity), address(Keep3rSugarMommy));
    }

    // Escrow Governable and CollectableDust governor bypass
    function setPendingGovernorOnEscrow(address _escrow, address _pendingGovernor) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::removeLiquidityFromJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.setPendingGovernor(_pendingGovernor);
    }
    function acceptGovernorOnEscrow(address _escrow) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::removeLiquidityFromJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.acceptGovernor();
    }
    function sendDustOnEscrow(address _escrow, address _to, address _token, uint256 _amount) external override onlyGovernor {
        require(_escrow == address(Escrow1) || _escrow == address(Escrow2), 'Keep3rEscrowJob::removeLiquidityFromJob:invalid-escrow');
        IKeep3rEscrow Escrow = IKeep3rEscrow(_escrow);
        Escrow.sendDust(_to, _token, _amount);
    }

}

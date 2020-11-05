# Strategies Keep3r

## Wishlist

### Strategies

* [x] [`CRV`](./contracts/keep3r/CrvStrategyKeep3r.sol) (`ycrv, busd, sbtc, 3pool`)
* [ ] (define next strats to keep3rfy)

## Scripts

### Get available rewards and workable for CRV (ycrv, busd, sbtc, 3pool) strategies.
`npx hardhat run scripts/crv/01-crv-keep3r-calculate-harvest.js`


## Contracts

---
> keep3r

### [`Keep3rAbstract.sol`](./contracts/keep3r/Keep3rAbstract.sol)

Abstract contract that should be used to extend from when creating StrategyKeep3rs (see [`CrvStrategyKeep3r.sol`](./contracts/keep3r/CrvStrategyKeep3r.sol))

```sol
  IKeep3rV1 public keep3r;
  constructor(address _keep3r) public
  function _setKeep3r(address _keep3r) internal
  function _isKeeper() internal
  modifier onlyKeeper()
  modifier paysKeeper()
```

### [`CrvStrategyKeep3r.sol`](./contracts/keep3r/CrvStrategyKeep3r.sol)
> [verified on etherscan](https://etherscan.io/address/0xd0aC37E3524F295D141d3839d5ed5F26A40b589D#code)

Yearn v1 CrvStrategies Keep3r for `ycrv`, `busd`, `sbtc` and `3pool` vaults/strats.

```sol
mapping(address => uint256) public requiredHarvest;
function isCrvStrategyKeep3r() external pure override returns (bool) { return true; }
```

Governor (strategist) functions:
```sol
function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor;
function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor;
function removeStrategy(address _strategy) external override onlyGovernor;
function setKeep3r(address _keep3r) external override onlyGovernor;
# safeguard that allows governor(strategist) to call harvest directly, not having to go through keep3r network.
function forceHarvest(address _strategy) external override onlyGovernor;
```

Keep3r functions
```sol
# Called externally to get available harvest in CRV by strategy
function calculateHarvest(address _strategy) public override returns (uint256 _amount);
# returns true if available harvest is greater or equal than required harvest
function workable(address _strategy) public override returns (bool);
# pays keep3rs to call havest on crv strategies
function harvest(address _strategy) external override paysKeeper;
```
> call `calculateHarvest` and `workable` functions with `callStatic` to avoid spending gas. (they can be pretty slow too)


---
> mock

### [`MockStrategy.sol`](./contracts/mock/MockStrategy.sol)

> TODO

### [`StrategyCurveYVoterProxyAbstract.sol`](./contracts/mock/StrategyCurveYVoterProxyAbstract.sol)

> TODO

## Adding new StrategyKeep3rs

- you can use [`CrvStrategyKeep3r.sol`](./contracts/keep3r/CrvStrategyKeep3r.sol) as a template

- adapt neccesarry functionality fo fit strategy requirements

- modify `calculateHarvest` function to get your strategy pending rewards correctly
    - it's better to have both `workable` and `calculateHarvest` as `view` functions, `CrvStrategyKeep3r` is not a good example for this.
        - > it's not a view function since it has to call a crv state-modifiyng function to calculate rewards.
        - > check [`CrvStrategyKeep3r-test.js`](./test/CrvStrategyKeep3r-test.js) for details on how to handle calls to non-view `workable` fucntions.

- make sure you have a `harvest` function that has the `paysKeeper` modifier.
- make sure you have a `forceHarvest` function that has the `onlyGovernor` modifier.

- also take into account that any `onlyStrategist` functions on the strategy will need an `onlyGovernor` proxy function on your keep3r
    - i.e. if the strategy contract has a `configureStrategy(...) onlyStrategist || msg.sender == strategist` you'll need to create a ` configureStrategy(...) onlyGovernor` on your `StrategyKeep3r` contract to keep having access to that method.

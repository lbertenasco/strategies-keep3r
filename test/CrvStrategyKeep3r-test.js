const { expect } = require('chai');
const config = require('../.config.json');

const base18DecimalUnit = ethers.BigNumber.from(1).pow(10, 18);

describe('CrvStrategyKeep3r', function() {
  let owner;
  let alice;
  before('Setup accounts and contracts', async () => {
    [owner, alice] = await ethers.getSigners();
  });

  it('Should deploy new CrvStrategyKeep3r with keep3r', async function() {
    const CrvStrategyKeep3r = await ethers.getContractFactory('CrvStrategyKeep3r');
    const crvStrategyKeep3r = await CrvStrategyKeep3r.deploy(config.contracts.mainnet.keep3r.address);
    await crvStrategyKeep3r.deployed();
    const isCrvStrategyKeep3r = await crvStrategyKeep3r.isCrvStrategyKeep3r();
    expect(isCrvStrategyKeep3r).to.be.true;
  });

  it.only('Should deploy on mainnet fork', async function() {
    // await hre.network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: ["0x1ea056C13F8ccC981E51c5f1CDF87476666D0A74"]
    // });

    const CrvStrategyKeep3r = await ethers.getContractFactory('CrvStrategyKeep3r');
    const crvStrategyKeep3r = (await CrvStrategyKeep3r.deploy(config.contracts.mainnet.keep3r.address)).connect(owner);
    
    // Setup crv strategies
    const ycrvContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.ycrv.address, owner);
    const busdContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.busd.address, owner);
    const sbtcContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.sbtc.address, owner);
    const pool3Contract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.pool3.address, owner);

    // Add crv strategies to crv keep3r
    console.time('addStrategy')
    const requiredHarvestAmount = base18DecimalUnit;
    await crvStrategyKeep3r.addStrategy(ycrvContract.address, requiredHarvestAmount);
    await crvStrategyKeep3r.addStrategy(busdContract.address, requiredHarvestAmount);
    await crvStrategyKeep3r.addStrategy(sbtcContract.address, requiredHarvestAmount);
    await crvStrategyKeep3r.addStrategy(pool3Contract.address, requiredHarvestAmount);
    console.timeEnd('addStrategy')
    
    console.time('calculateHarvest')
    console.log('calculateHarvest(ycrv)', (await crvStrategyKeep3r.callStatic.calculateHarvest(ycrvContract.address)).toString())
    console.log('calculateHarvest(busd)', (await crvStrategyKeep3r.callStatic.calculateHarvest(busdContract.address)).toString())
    console.log('calculateHarvest(sbtc)', (await crvStrategyKeep3r.callStatic.calculateHarvest(sbtcContract.address)).toString())
    console.log('calculateHarvest(pool3)', (await crvStrategyKeep3r.callStatic.calculateHarvest(pool3Contract.address)).toString())
    console.timeEnd('calculateHarvest')

    console.time('workable')
    console.log('workable(ycrv)', await crvStrategyKeep3r.callStatic.workable(ycrvContract.address))
    console.log('workable(busd)', await crvStrategyKeep3r.callStatic.workable(busdContract.address))
    console.log('workable(sbtc)', await crvStrategyKeep3r.callStatic.workable(sbtcContract.address))
    console.log('workable(pool3)', await crvStrategyKeep3r.callStatic.workable(pool3Contract.address))
    console.timeEnd('workable')
    
    console.log('TODO: Register as keeper')
    console.time('harvest')
    console.log('harvest(ycrv)', await crvStrategyKeep3r.harvest(ycrvContract.address))
    console.log('harvest(busd)', await crvStrategyKeep3r.harvest(busdContract.address))
    console.log('harvest(sbtc)', await crvStrategyKeep3r.harvest(sbtcContract.address))
    console.log('harvest(pool3)', await crvStrategyKeep3r.harvest(pool3Contract.address))
    console.timeEnd('harvest')
    
  });

});

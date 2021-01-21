const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to run escrow keep3r for yearn jobs?');

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          const escrowContracts = config.contracts.mainnet.escrow;
          const [owner] = await ethers.getSigners();
          // Setup deployer
          await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
          const deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);
          // impersonate whale
          await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [escrowContracts.whale] });
          const whale = owner.provider.getUncheckedSigner(escrowContracts.whale);
          (await ethers.getContractFactory('ForceETH')).deploy(whale._address, { value: e18 });

          const keep3r = await ethers.getContractAt('IKeep3rV1', escrowContracts.keep3r, deployer);

          const Keep3rEscrow = await ethers.getContractFactory('Keep3rEscrow');
          const keep3rEscrow = await Keep3rEscrow.deploy(escrowContracts.governance, escrowContracts.keep3r, escrowContracts.lpToken);

          // Setup deployed keep3rEscrow
          // const keep3rEscrow = await ethers.getContractAt('Keep3rEscrow', escrowContracts.escrow1, deployer);

          const jobs = {
            'crvStrategyKeep3r': { address: escrowContracts.jobs['crvStrategyKeep3r'], contractName: 'CrvStrategyKeep3r' },
            'vaultKeep3r': { address: escrowContracts.jobs['vaultKeep3r'], contractName: 'VaultKeep3r'},
          };

          // Setup jobs
          for (const job in jobs) {
            jobs[job].contract = await ethers.getContractAt(jobs[job].contractName, jobs[job].address, deployer);
          }

          console.time('current credits')
          for (const job in jobs) {
            const credits = await keep3r.callStatic.credits(config.contracts.mainnet[job].address, keep3r.address)
            console.log(`${job} credits:`, e18ToDecimal(credits))
          }
          console.timeEnd('current credits')

          const job = jobs[Object.keys(jobs)[0]]; // Get first job
          const liquidity = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', escrowContracts.lpToken, deployer);
          const amount = e18.mul(1);
          console.log('amount', e18ToDecimal(amount))
          await liquidity.connect(whale).transfer(keep3rEscrow.address, amount);
          console.log('lpBalance', e18ToDecimal(await liquidity.callStatic.balanceOf(keep3rEscrow.address)))
          

          // addLiquidityToJob(address _liquidity, address _job, uint _amount)
          console.log('addLiquidityToJob:')
          await keep3rEscrow.addLiquidityToJob(liquidity.address, job.address, amount);
          console.log('  lpBalance', e18ToDecimal(await liquidity.callStatic.balanceOf(keep3rEscrow.address)))
          console.log('  credits', e18ToDecimal(await keep3r.callStatic.credits(job.address, keep3r.address)))
          console.log('  liquidityProvided', e18ToDecimal(await keep3r.callStatic.liquidityProvided(keep3rEscrow.address, liquidity.address, job.address)))
          console.log('  liquidityApplied', (await keep3r.callStatic.liquidityApplied(keep3rEscrow.address, liquidity.address, job.address)).toNumber())
          console.log('  liquidityAmount', e18ToDecimal(await keep3r.callStatic.liquidityAmount(keep3rEscrow.address, liquidity.address, job.address)))
          
          // Increase time
          await hre.network.provider.request({ method: "evm_increaseTime", params: [3 * 24 * 60 * 60] }); // 3 days
          await hre.network.provider.request({ method: "evm_mine", params: [] });
          
          // applyCreditToJob(address provider, address _liquidity, address _job)
          console.log('applyCreditToJob:')
          await keep3rEscrow.applyCreditToJob(keep3rEscrow.address, liquidity.address, job.address);
          console.log('  credits', e18ToDecimal(await keep3r.callStatic.credits(job.address, keep3r.address)))
          console.log('  liquidityAmount', e18ToDecimal(await keep3r.callStatic.liquidityAmount(keep3rEscrow.address, liquidity.address, job.address)))
          
          // unbondLiquidityFromJob(address _liquidity, address _job, uint _amount)
          console.log('unbondLiquidityFromJob:')
          await keep3rEscrow.unbondLiquidityFromJob(liquidity.address, job.address, amount);
          console.log('  credits', e18ToDecimal(await keep3r.callStatic.credits(job.address, keep3r.address)))
          console.log('  liquidityUnbonding', e18ToDecimal(await keep3r.callStatic.liquidityUnbonding(keep3rEscrow.address, liquidity.address, job.address)))
          console.log('  liquidityAmountsUnbonding', e18ToDecimal(await keep3r.callStatic.liquidityAmountsUnbonding(keep3rEscrow.address, liquidity.address, job.address)))
          
          // Increase time
          await hre.network.provider.request({ method: "evm_increaseTime", params: [14 * 24 * 60 * 60] }); // 14 days
          await hre.network.provider.request({ method: "evm_mine", params: [] });

          // removeLiquidityFromJob(address _liquidity, address _job)
          console.log('removeLiquidityFromJob:')
          await keep3rEscrow.removeLiquidityFromJob(liquidity.address, job.address);
          console.log('  lpBalance', e18ToDecimal(await liquidity.callStatic.balanceOf(keep3rEscrow.address)))
          console.log('  liquidityProvided', e18ToDecimal(await keep3r.callStatic.liquidityProvided(keep3rEscrow.address, liquidity.address, job.address)))
          console.log('  liquidityAmountsUnbonding', e18ToDecimal(await keep3r.callStatic.liquidityAmountsUnbonding(keep3rEscrow.address, liquidity.address, job.address)))

          // removeLiquidityFromJob(address _liquidity, address _job)
          console.log('removeLiquidityFromJob:')
          await keep3rEscrow.returnLPsToGovernance();
          console.log('  lpBalance', e18ToDecimal(await liquidity.callStatic.balanceOf(keep3rEscrow.address)))
          console.log('  lpBalance(governance)', e18ToDecimal(await liquidity.callStatic.balanceOf(escrowContracts.governance)))

          resolve();
        } else {
          console.error('Aborted!');
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

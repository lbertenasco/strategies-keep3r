import hre from 'hardhat';
import { ContractFactory } from 'ethers';
const ethers = hre.ethers;
import * as accounts from '../../utils/accounts';
import * as contracts from '../../utils/contracts';

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Setup deployer
      const [owner] = await ethers.getSigners();
      let deployer;
      if (owner.address == accounts.yKeeper) {
        deployer = owner;
      } else {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [accounts.yKeeper],
        });
        deployer = (owner.provider as any).getUncheckedSigner(accounts.yKeeper);
      }

      const v2Keeper = await ethers.getContractAt(
        'V2Keeper',
        contracts.v2Keeper.ftm,
        deployer
      );

      /**
      def all_vaults():
          regist = registry()
          vaults = []
          for i in range(0, regist.numTokens()):
              for j in range(0,20):
                  vault = regist.vaults(regist.tokens(i), j)
                  if vault == '0x0000000000000000000000000000000000000000':
                      break
                  #vault = regist.latestVault(regist.tokens(i))
                  vaults.append(assess_vault_version(vault))
          return vaults

      def all_strats(vault):
          strategies = []
          for i in range(20):
              s = vault.withdrawalQueue(i)
              if s == ZERO_ADDRESS:
                  return strategies
              strategies.append(Contract(s))
       */

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

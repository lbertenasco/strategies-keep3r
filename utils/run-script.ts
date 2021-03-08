const { Select } = require('enquirer');
import { spawn } from 'child_process';

const scripts = [
  {
    name: 'crv:: strategy-keep3r-job: workable',
    path: 'scripts/jobs/crv/01-crv-strategy-keep3r-job-workable.ts',
    networks: ['staticMainnet'],
  },
  {
    name: 'crv:: strategy-keep3r-job: add-strategies',
    path: 'scripts/jobs/crv/02-crv-strategy-keep3r-job-add-strategies.js',
    networks: ['hardhat', 'mainnet'],
  },
  {
    name: 'proxy:: workable: fast',
    path: 'scripts/proxy-job/01-workable-keep3r-proxy-job-fast.js',
    networks: ['staticMainnet'],
  },
];
const selectScriptPrompt = new Select({
  message: 'Select a script to run',
  choices: scripts.map((script) => script.name),
});

async function main() {
  const scriptName = await selectScriptPrompt.run();
  const script = scripts.find((script) => script.name === scriptName);
  if (!script) return;

  let network = script.networks[0];
  if (script.networks.length > 1)
    network = await new Select({
      message: 'Select a network',
      choices: script.networks,
    }).run();

  await runScript(script.path, network);
}

async function runScript(path: string, network: string) {
  return new Promise((resolve, reject) => {
    const script = spawn(`npx hardhat run ${path}`, ['--network', network], {
      shell: true,
      stdio: 'inherit',
    });

    script.on('error', (error) => {
      reject(error.message);
    });

    script.on('close', (code) => {
      resolve(code);
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { runSimulation } from '../modules/experiment/ado/adoSimulation';

runSimulation()
  .then(() => {
    // intentionally empty
  })
  .catch((err) => {
    // ensure errors are visible
    // eslint-disable-next-line no-console
    console.error('Simulation failed:', err);
    process.exit(1);
  });

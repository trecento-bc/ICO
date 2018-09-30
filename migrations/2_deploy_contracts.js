var TOTToken = artifacts.require('TOTToken');

// NOTE: Use this file to easily deploy the contracts you're writing.
//   (but make sure to reset this file before committing
//    with `git checkout HEAD -- migrations/2_deploy_contracts.js`)

module.exports = function (deployer) {
  deployer.deploy(TOTToken, '0xBa893462c1b714bFD801e918a4541e056f9bd924', '0x2418C46F2FA422fE8Cd0BF56Df5e27CbDeBB2590', '0x84bE27E1d3AeD5e6CF40445891d3e2AB7d3d98e8');
  //0xa5b006cdd7cf51a053ff53f4cad6b0b90458a689
};

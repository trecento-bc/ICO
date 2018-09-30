// Artifacts
const Migrations = artifacts.require('./Migrations.sol')
const TrecentoCrowdsale = artifacts.require('./TrecentoCrowdsale.sol')
const TrecentoToken = artifacts.require('./TrecentoToken.sol')

module.exports = function(deployer) {
  let token, crowdsale

  deployer.then(async function() {
    token = await TrecentoToken.new()

    crowdsale = await TrecentoCrowdsale.new(
      token.address,
      process.env.PRICES_CONTRACT,
      process.env.KYC_REGISTRY_CONTRACT,
      process.env.TRECENTO_WALLET
    )

    console.log("Token address", token.address)
    console.log("Crowdsale address", crowdsale.address)

    return token.setForgerStatus(crowdsale.address, true);
  })
}

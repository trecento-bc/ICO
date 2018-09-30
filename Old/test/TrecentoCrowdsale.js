const assert = require('assert')
const {assertReverts, assertLog, assertEq, assertInvalidOpCode, to18thOrder} = require('./lib')

const KycRegistry = artifacts.require('KycRegistry')
const PricesInterfaceTest = artifacts.require('PricesInterfaceTest')
const TrecentoToken = artifacts.require('TrecentoToken')
const TrecentoCrowdsale = artifacts.require('TrecentoCrowdsale')

// 1 euro cent in ethereum wei
const eurCentToWei = 24416628315485;

contract('TrecentoCrowdsale', ([thesaurioAdmin, admin, trecentoWallet, user1, user2, user3, user4]) => {
  let kycRegistry, prices, trecentoToken, trecentoCrowdsale

  async function setupContracts() {
    const kycRegistry = await KycRegistry.new(thesaurioAdmin, {from: thesaurioAdmin})
    const prices = await PricesInterfaceTest.new(eurCentToWei, 0, 0, 0, 0, 0, {from: thesaurioAdmin})
    const trecentoToken = await TrecentoToken.new({from: admin})
    const trecentoCrowdsale = await TrecentoCrowdsale.new(
      trecentoToken.address,
      prices.address,
      kycRegistry.address,
      trecentoWallet,
      {from: admin}
    )

    return {kycRegistry, prices, trecentoToken, trecentoCrowdsale}
  }

  beforeEach('redeploy', async function () {
    const contracts = await setupContracts()
    kycRegistry = contracts.kycRegistry
    prices = contracts.prices
    trecentoToken = contracts.trecentoToken
    trecentoCrowdsale = contracts.trecentoCrowdsale

    // Giving the right to crowdsale contract to forge tokens
    await trecentoToken.setForgerStatus(trecentoCrowdsale.address, true, {from: admin})
    // Clearing USER1 in KycRegistry Contract
    await kycRegistry.kycStatusSet(user1, true, {from: thesaurioAdmin})
  })

  it('validates the behaviour of the prices test contract', async function() {
    assertEq(await prices.eurPrice(), eurCentToWei)
    assertEq(await prices.usdPrice(), 0)
    assertEq(await prices.cnyPrice(), 0)
    assertEq(await prices.jpyPrice(), 0)
    assertEq(await prices.gbpPrice(), 0)
    assertEq(await prices.rubPrice(), 0)
  })

  it('permits to owner to change crowdsale parameters', async function() {
    await assertReverts(
      trecentoCrowdsale.changeCrowdsaleSettings(110, 1000, 1150, true, {from: user1})
    )
    assertEq(await trecentoCrowdsale.tokenPriceInEuroCents(), 100)
    assertEq(await trecentoCrowdsale.minimumContributionEuroCents(), 1000000)
    assertEq(await trecentoCrowdsale.bonusPerThousandMultiplier(), 1200)
    assertEq(await trecentoCrowdsale.crowdsaleEnabled(), false)

    await trecentoCrowdsale.changeCrowdsaleSettings(110, 1000, 1150, true, {from: admin})
    assertEq(await trecentoCrowdsale.tokenPriceInEuroCents(), 110)
    assertEq(await trecentoCrowdsale.minimumContributionEuroCents(), 1000)
    assertEq(await trecentoCrowdsale.bonusPerThousandMultiplier(), 1150)
    assertEq(await trecentoCrowdsale.crowdsaleEnabled(), true)
  })

  it('returns the right distribution information in distributionInfo method', async function() {
    const distributionInfo = await trecentoCrowdsale.distributionInfo()

    assertEq(distributionInfo[0], eurCentToWei*1000000)
    assertEq(distributionInfo[1], 0)
    assertEq(distributionInfo[2], eurCentToWei*100)
    assertEq(distributionInfo[3], 1200)
    assertEq(distributionInfo[4], 0)
  })

  it('returns the right amount of minimum contribution', async function() {
    assertEq(await trecentoCrowdsale.minimumContribution(), eurCentToWei*1000000)
  })

  it('calculates the right price of token in wei', async function() {
    assertEq(await trecentoCrowdsale.tokenPriceInWei(), eurCentToWei*100)
  })

  it('calculates the right amount of token given a price and a value', async function() {
      await trecentoCrowdsale.changeCrowdsaleSettings(100, 1000, 1300, true, {from: admin})
    // Given case : 1.34 ETH
    // 1.34e18 / (24416628315485 * 100) = 548,806322759 (without bonus)
    // With bonus 30% :
    // 548,806322759 * 1.3 = 713,448219586987541588
    assertEq(await trecentoCrowdsale.tokenPriceInEuroCents(), 100)
    assertEq(await trecentoCrowdsale.bonusPerThousandMultiplier(), 1300)
    assertEq(await trecentoCrowdsale.tokenAmount(to18thOrder(1.34)), '713448219586987541588')

    await trecentoCrowdsale.changeCrowdsaleSettings(113, 1000, 1175, true, {from: admin})
    // Given case : 1.73 ETH
    // 1.73e18 / (24416628315485 * 113) = 627.0208284067181 (without bonus)
    // With bonus 17.5% :
    // 627.0208284067181 * 1.175 = 736.749473377893848573
    assertEq(await trecentoCrowdsale.tokenPriceInEuroCents(), 113)
    assertEq(await trecentoCrowdsale.bonusPerThousandMultiplier(), 1175)
    assertEq(await trecentoCrowdsale.tokenAmount(to18thOrder(1.73)), '736749473377893848573')
  })

  it('refuses a contribution from a not-cleared in KycRegistry address', async function() {
    await trecentoCrowdsale.changeCrowdsaleSettings(100, 1000, 1300, true, {from: admin})
    await assertReverts(
      trecentoCrowdsale.sendTransaction({from: user2, value: to18thOrder(1.4)})
    )
  })

  it('refuses a contribution if the minimum amount is not matched', async function() {
    await trecentoCrowdsale.changeCrowdsaleSettings(100, 1000, 1300, true, {from: admin})
    await assertReverts(
      trecentoCrowdsale.sendTransaction({from: user1, value: to18thOrder(0.0001)})
    )
  })

  it('refuses a contribution if the crowdsale is not running.', async function() {
    await assertReverts(
      trecentoCrowdsale.sendTransaction({from: user1, value: to18thOrder(1.4)})
    )
  })

  it('accepts a contribution when all conditions are met', async function() {
    await trecentoCrowdsale.changeCrowdsaleSettings(100, 1000, 1300, true, {from: admin})
    await trecentoCrowdsale.sendTransaction({from: user1, value: to18thOrder(1.34)})
    assertEq(await trecentoToken.balanceOf(user1), '713448219586987541588')
  })

  it('refuses a contribution if the crowdsale is not running, and accept it otherwise.', async function() {
    await assertReverts(
      trecentoCrowdsale.sendTransaction({from: user1, value: to18thOrder(1.4)})
    )
  })

  it('accepts a other currency payment trigger only from owner', async function() {
    await assertReverts(
      trecentoCrowdsale.otherCurrencyPayment(1150, user1, {from: user1})
    )

    await trecentoCrowdsale.changeCrowdsaleSettings(100, 1000, 1300, true, {from: admin})
    // Given case : 11.50 EUR
    // 11.50 EUR = 11.50 tokens (without bonus)
    // With bonus 30% :
    // 11.50 * 1.3 = 14.95
    await trecentoCrowdsale.otherCurrencyPayment(1150, user1, {from: admin})
    assertEq(await trecentoToken.balanceOf(user1), to18thOrder('14.95'))
  })

  it('updates the amount of currently raised amount', async function() {
    await trecentoCrowdsale.changeCrowdsaleSettings(100, 500, 1300, true, {from: admin})
    // 65216628115485000 => 26.70 EUR
    await trecentoCrowdsale.sendTransaction({from: user1, value: '65216628115485000'})
    assertEq(await trecentoCrowdsale.currentlyRaisedEuroCents(), '2670')

    await trecentoCrowdsale.otherCurrencyPayment(1150, user1, {from: admin})
    assertEq(await trecentoCrowdsale.currentlyRaisedEuroCents(), '3820')
  })

  it('refuses contribution if it gets over the hardcap', async function() {
    await trecentoCrowdsale.changeCrowdsaleSettings(100, 500, 1300, true, {from: admin})
    // Getting near hard-cap
    await trecentoCrowdsale.otherCurrencyPayment(4999990000 , user1, {from: admin})
    assertEq(await trecentoCrowdsale.currentlyRaisedEuroCents(), '4999990000')
    // Sending 1000 euro in ETH (passing over hardcap)
    await assertReverts(
      trecentoCrowdsale.sendTransaction({from: user1, value: '2441662831548500000'})
    )
    // Sending 1000 euro through other payment mean (passing over hardcap)
    await assertReverts(
      trecentoCrowdsale.otherCurrencyPayment(500000, user1, {from: admin})
    )
  })
})

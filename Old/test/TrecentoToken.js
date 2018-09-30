const assert = require('assert')
const {assertReverts, assertLog, assertEq, to18thOrder} = require('./lib')

const TrecentoToken = artifacts.require('TrecentoToken')
const ApproveAndCallFallBackTest = artifacts.require('ApproveAndCallFallBackTest')

contract('TrecentoToken', ([admin, forger, user1, user2, user3, user4]) => {
  let trecentoToken

  async function setupContracts() {
    const trecentoToken = await TrecentoToken.new({from: admin})
    return {trecentoToken}
  }

  beforeEach('redeploy', async function () {
    const contracts = await setupContracts()
    trecentoToken = contracts.trecentoToken
    // Register forger
    await trecentoToken.setForgerStatus(forger, true, {from: admin})
    // User 1 : Has supply, has freeze bypass
    await trecentoToken.forge(user1, to18thOrder(2000), {from: forger})
    await trecentoToken.allowFreezeBypass(user1, {from: admin})
    // User 2 : Has supply, has not freeze bypass
    await trecentoToken.forge(user2, to18thOrder(2000), {from: forger})
    // User 3 : Has no supply, has freeze bypass
    await trecentoToken.allowFreezeBypass(user3, {from: admin})
    // User 4 : Has no supply, has no freeze bypass
    // No Tx : default state
  })

  it('sets the parameters correctly when admin calls distribution and freeze methods', async function() {
    assertEq(await trecentoToken.balanceOf(user1), to18thOrder(2000))
    assertEq(await trecentoToken.balanceOf(user2), to18thOrder(2000))
    assertEq(await trecentoToken.freezeBypassing(user1), true)
    assertEq(await trecentoToken.freezeBypassing(user3), true)
  })

  it('returns the right amount in the totalSupply() method', async function() {
    assertEq(await trecentoToken.totalSupply(), to18thOrder(2000+2000)) // user1 + user2 in redeploy hook
  })

  it('only allows forgers to forge tokens', async function() {
    await assertReverts(
      trecentoToken.forge(user4, to18thOrder(1000), {from: user1})
    )
    assertEq(await trecentoToken.balanceOf(user4), 0)

    await trecentoToken.forge(user4, to18thOrder(1000), {from: forger})
    assertEq(await trecentoToken.balanceOf(user4), to18thOrder(1000))
  })

  it('permits to a freeze-bypasser to send tokens', async function() {
    assertEq(await trecentoToken.tradingLive(), false)
    await trecentoToken.transfer(user4, to18thOrder(1000), {from: user1})
    assertEq(await trecentoToken.balanceOf(user1), to18thOrder(1000))
    assertEq(await trecentoToken.balanceOf(user4), to18thOrder(1000))
  })

  it('does not permit to a non-freeze-bypasser to send tokens if tradinf is not live', async function() {
    assertEq(await trecentoToken.tradingLive(), false)

    await assertReverts(
      trecentoToken.transfer(user4, to18thOrder(1000), {from: user2})
    )

    assertEq(await trecentoToken.balanceOf(user2), to18thOrder(2000))
    assertEq(await trecentoToken.balanceOf(user4), to18thOrder(0))
  })

  it('permits to a non-freeze-bypasser to send tokens if trading is live', async function() {
    await trecentoToken.setTradingLive({from: admin})
    assertEq(await trecentoToken.tradingLive(), true)

    assertLog(await trecentoToken.transfer(user4, to18thOrder(1000), {from: user2}), 'Transfer', {
      from: user2,
      to: user4,
      tokens: to18thOrder(1000)
    })

    assertEq(await trecentoToken.balanceOf(user2), to18thOrder(1000))
    assertEq(await trecentoToken.balanceOf(user4), to18thOrder(1000))
  })

  it('creates and returns approvals correctly', async function() {
    assertLog(await trecentoToken.approve(user4, to18thOrder(100), {from: user1}), 'Approval', {
      tokenOwner: user1,
      spender: user4,
      tokens: to18thOrder(100)
    })
    assertEq(await trecentoToken.allowance(user1, user4), to18thOrder(100))
  })

  it('creates an allowance and permit to spend the token, if trading is live', async function() {
    await trecentoToken.setTradingLive({from: admin})
    assertEq(await trecentoToken.tradingLive(), true)

    assertLog(await trecentoToken.approve(user4, to18thOrder(100), {from: user1}), 'Approval', {
      tokenOwner: user1,
      spender: user4,
      tokens: to18thOrder(100)
    })
    assertEq(await trecentoToken.allowance(user1, user4), to18thOrder(100))
    assertLog(await trecentoToken.transferFrom(user1, user3, to18thOrder(100), {from: user4}), 'Transfer', {
      from: user1,
      to: user3,
      tokens: to18thOrder(100)
    })
    assertEq(await trecentoToken.balanceOf(user3), to18thOrder(100))
  })

  it('creates an allowance and permit to spend the token, if trading is not live but tokenOwner is a freeze-bypasser', async function() {
    assertLog(await trecentoToken.approve(user4, to18thOrder(100), {from: user1}), 'Approval', {
      tokenOwner: user1,
      spender: user4,
      tokens: to18thOrder(100)
    })
    assertEq(await trecentoToken.allowance(user1, user4), to18thOrder(100))
    assertLog(await trecentoToken.transferFrom(user1, user3, to18thOrder(100), {from: user4}), 'Transfer', {
      from: user1,
      to: user3,
      tokens: to18thOrder(100)
    })
    assertEq(await trecentoToken.balanceOf(user3), to18thOrder(100))
  })

  it('handles token transfer approval to a contract', async function() {
    const destinationContract = await ApproveAndCallFallBackTest.new()
    const tokenAmount = to18thOrder(100)

    assertLog(await trecentoToken.approveAndCall(destinationContract.address, tokenAmount, 'Hello World !', {from: user1}), 'Approval', {
      tokenOwner: user1,
      spender: destinationContract.address,
      tokens: tokenAmount,
    })

    assertEq(await destinationContract.from(), user1)
    assertEq(await destinationContract.token(), trecentoToken.address)
    assertEq(await destinationContract.tokens(), tokenAmount)
    assertEq(await destinationContract.data(), web3.fromAscii('Hello World !'))
  })

  it('permits to withdraw any lost ERC20 token from the contract', async function() {
    otherTrecentoToken = await TrecentoToken.new({from: admin})
    await otherTrecentoToken.setForgerStatus(forger, true)
    await otherTrecentoToken.setTradingLive({from: admin})

    await otherTrecentoToken.forge(trecentoToken.address, to18thOrder(100), {from: forger})
    assertEq(await otherTrecentoToken.balanceOf(trecentoToken.address), to18thOrder(100))

    await trecentoToken.transferAnyERC20Token(otherTrecentoToken.address, to18thOrder(100), {from: admin})
    assertEq(await otherTrecentoToken.balanceOf(trecentoToken.address), 0)
    assertEq(await otherTrecentoToken.balanceOf(admin), to18thOrder(100))
  })

  it('permits to transfert its ownership', async function() {
    assertEq(await trecentoToken.owner(), admin)
    await trecentoToken.transferOwnership(user4, {from: admin})
    assertEq(await trecentoToken.owner(), admin)
    await trecentoToken.acceptOwnership({from: user4})
    assertEq(await trecentoToken.owner(), user4)
  })

  it('checks if the new owner is allowed to accept it', async function() {
    assertEq(await trecentoToken.owner(), admin)
    await trecentoToken.transferOwnership(user4, {from: admin})
    assertEq(await trecentoToken.owner(), admin)
    await assertReverts(
      trecentoToken.acceptOwnership({from: user3})
    )
    assertEq(await trecentoToken.owner(), admin)
  })
})

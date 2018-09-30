import assertRevert from './helpers/assertRevert';
import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import BigNumber from 'bignumber.js';


const Distribute = artifacts.require('./Distribute.sol');
const TOTToken = artifacts.require('./TOTToken.sol');

contract('Distribute', function ([owner, project, anotherAccount, wallet, user1, user2, user3, foundationAddress, teamAddress, bountyAddress]) {
  let token;
  let distribute;

  const batchListAccount = [user1, user2, user3];
  const batchListAmount = [10000 * 10 ** 18, 10000 * 10 ** 18, 10000 * 10 ** 18];


  async function setupContracts() {
    const token = await TOTToken.new({from : owner});
    const distribute = await Distribute.new(token.address, foundationAddress, teamAddress, bountyAddress, {from : owner});

    await token.transferOwnership(distribute.address, {from : owner});
    return {token, distribute}
  }

  beforeEach('redeploy', async function () {
    const contracts = await setupContracts()
    token = contracts.token
    distribute = contracts.distribute
  });


  describe('Transfer ownership token to distribute contract', function () {
    it('return the same address', async function () {
      assert.equal(await token.owner.call(), distribute.address);
    });
  });

  describe('Distribute contract initialisation', function () {
    it('check contract details', async function () {
      assert.equal(await distribute.token.call(), token.address);
      assert.equal(await distribute.foundationAddress.call(), foundationAddress);
      assert.equal(await distribute.teamAddress.call(), teamAddress);
      assert.equal(await distribute.bountyAddress.call(), bountyAddress);
    });
  });

  describe('update wallets', function () {
    it('rejects updateWallets when the caller is not the owner', async function () {
       await assertRevert(distribute.updateWallets(foundationAddress, teamAddress, bountyAddress, {from : anotherAccount}));
    });
    it('rejects updateWallets when the minting is finished', async function () {
       await distribute.batchMint(batchListAccount, batchListAmount, { from: owner });
       await distribute.finishMinting({from : owner});
       await assertRevert(distribute.updateWallets(foundationAddress, teamAddress, bountyAddress, {from : owner}));
    });
    it('accepts updateWallets when the caller is the owner', async function () {
       await distribute.updateWallets(foundationAddress, teamAddress, bountyAddress, {from : owner});
    });
  });

  describe('finishMinting', function () {
    it('should allocate Foundation, Team and Bounty ', async function () {
      await distribute.batchMint(batchListAccount, batchListAmount, { from: owner });
      await distribute.finishMinting({ from: owner });

      const PURCHASER_AMOUNT = await token.totalSupply();

      let bountyBalance = await token.balanceOf(bountyAddress);
      assert.equal(bountyBalance.valueOf(), PURCHASER_AMOUNT.mul(5).div(100).valueOf());

      let foundationBalance = await token.balanceOf(foundationAddress);
      assert.equal(foundationBalance.valueOf(), PURCHASER_AMOUNT.mul(5).div(100).valueOf());

      let contractBalance = await token.balanceOf(distribute.address);
      assert.equal(contractBalance.valueOf(), PURCHASER_AMOUNT.mul(15).div(100).valueOf());

      assert.equal(await token.mintingFinished.call(), true);
    });
    it('should revert when minting after finishMinting ', async function () {
      await distribute.batchMint(batchListAccount, batchListAmount, { from: owner });
      await distribute.finishMinting({ from: owner });

      await assertRevert(distribute.batchMint(batchListAccount, batchListAmount, { from: owner }));
    });
  });

  describe('Vesting', function () {
    it('distribute first round of vested tokens', async function () {
      await distribute.batchMint(batchListAccount, batchListAmount, { from: owner });
      await distribute.finishMinting({ from: owner });

      const PURCHASER_AMOUNT = await token.totalSupply();
      const TOKENSTORELEASE = PURCHASER_AMOUNT.mul(15).div(100).mul(25).div(100);

      let period1 = await distribute.period1.call();
      await increaseTimeTo(period1);
      await distribute.TeamtokenRelease1({from : owner});
      let teamBalance = await token.balanceOf(teamAddress);
      assert.equal(teamBalance.valueOf(), TOKENSTORELEASE.valueOf());

      let period2 = await distribute.period2.call();
      await increaseTimeTo(period2);
      await distribute.TeamtokenRelease2({from : owner});
      teamBalance = await token.balanceOf(teamAddress);
      assert.equal(teamBalance.valueOf(), TOKENSTORELEASE.mul(2).valueOf());

      let period3 = await distribute.period3.call();
      await increaseTimeTo(period3);
      await distribute.TeamtokenRelease3({from : owner});
      teamBalance = await token.balanceOf(teamAddress);
      assert.equal(teamBalance.valueOf(), TOKENSTORELEASE.mul(3).valueOf());

      let period4 = await distribute.period4.call();
      await increaseTimeTo(period4);
      await distribute.TeamtokenRelease4({from : owner});
      teamBalance = await token.balanceOf(teamAddress);
      assert.equal(teamBalance.valueOf(), TOKENSTORELEASE.mul(4).valueOf());

      assert.equal(await distribute.releasedTokens.call(), TOKENSTORELEASE.mul(4).valueOf());
    });
  });

});

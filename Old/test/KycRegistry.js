const assert = require('assert')
const {assertReverts} = require('./lib');

const KycRegistry = artifacts.require('KycRegistry');

contract('KycRegistry', ([oracle, newOracle, address1, address2]) => {
  let kycRegistry;

  beforeEach('redeploy', async function() {
    kycRegistry = await KycRegistry.new(oracle);
  });

  it('has the correct oracle address', async function() {
    assert.equal(await kycRegistry.oracleAddress(), oracle);
  });

  it('has no address cleared by default', async function() {
    assert.equal(await kycRegistry.isAddressCleared(address1), false);
    assert.equal(await kycRegistry.isAddressCleared(address2), false);
  });

  it('clears an address', async function() {
    await kycRegistry.kycStatusSet(address1, true, {from: oracle});

    assert.equal(await kycRegistry.isAddressCleared(address1), true);
    assert.equal(await kycRegistry.isAddressCleared(address2), false);
  });

  it('unclears an address', async function() {
    await kycRegistry.kycStatusSet(address1, true, {from: oracle});
    await kycRegistry.kycStatusSet(address2, true, {from: oracle});
    await kycRegistry.kycStatusSet(address1, false, {from: oracle});

    assert.equal(await kycRegistry.isAddressCleared(address1), false);
    assert.equal(await kycRegistry.isAddressCleared(address2), true);
  });

  it('can only be cleared by oracle', async function() {
    await assertReverts(kycRegistry.kycStatusSet(address2, true, {from: address1}));
  });

  it('can update oracle address', async function() {
    await kycRegistry.updateOracleAddress(newOracle, {from: oracle});
    await assertReverts(kycRegistry.kycStatusSet(address1, true, {from: oracle}));
    await assertReverts(kycRegistry.kycStatusSet(address1, true, {from: address1}));

    await kycRegistry.kycStatusSet(address1, true, {from: newOracle});

    assert.equal(await kycRegistry.isAddressCleared(address1), true);
  });

  it('cannot update oracle address from another address', async function() {
    await assertReverts(kycRegistry.updateOracleAddress(newOracle, {from: address1}));
  });
});

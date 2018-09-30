const assert = require('assert')
const {assertInvalidOpCode} = require('./lib');

const BigNumber = require('bignumber.js');
const SafeMathTest = artifacts.require('./lib/SafeMathTest');

const hugeNumber = new BigNumber(2).pow(256).sub(1);

contract('SafeMathTest', () => {
  let safeMathTest;

  beforeEach('redeploy', async function() {
    safeMathTest = await SafeMathTest.new();
  });

  it('can add two numbers', async function() {
    assert.equal(await safeMathTest.add(42, 69), 111);
  });

  it('reverts on addition overflow', async function() {
    await assertInvalidOpCode(safeMathTest.add(hugeNumber, 1));
  });

  it('can substract two numbers', async function() {
    assert.equal(await safeMathTest.sub(69, 42), 27);
  });

  it('reverts on substraction underflow', async function() {
    await assertInvalidOpCode(safeMathTest.sub(42, 69));
  });

  it('can multiply two numbers', async function() {
    assert.equal(await safeMathTest.mul(42, 69), 2898);
  });

  it('return 0 when multiplied by 0', async function() {
    assert.equal(await safeMathTest.mul(0, 69), 0);
  });

  it('reverts on multiplication overflow', async function() {
    await assertInvalidOpCode(safeMathTest.mul(hugeNumber, 2));
  });

  it('can divide two numbers', async function() {
    assert.equal(await safeMathTest.div(420, 69), 6);
  });

  it('reverts on division by zero', async function() {
    await assertInvalidOpCode(safeMathTest.div(42, 0));
  });
});

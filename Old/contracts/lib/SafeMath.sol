pragma solidity ^0.4.21;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }

  /**
  * @dev Divides two numbers with 18 decimals, represented as uints (e.g. ether or token values)
  */
  uint constant ETHER_PRECISION = 10 ** 18;
  function ethdiv(uint x, uint y) internal pure returns (uint z) {
      // Put x to the 36th order of magnitude, so natural division will put it back to the 18th
      // Adding y/2 before putting x back to the 18th order of magnitude is necessary to force the EVM to round up instead of down
      z = add(mul(x, ETHER_PRECISION), y / 2) / y;
  }

  /**
  * @dev Divides two numbers with 2 decimals, represented as uints (e.g. ether or token values)
  */
  uint constant FIAT_PRECISION = 10 ** 2;
  function fiatdiv(uint x, uint y) internal pure returns (uint z) {
      // Put x to the 4th order of magnitude, so natural division will put it back to the 2th
      // Adding y/2 before putting x back to the 18th order of magnitude is necessary to force the EVM to round up instead of down
      z = add(mul(x, FIAT_PRECISION), y / 2) / y;
  }
}

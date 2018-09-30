pragma solidity ^0.4.21;

import './PricesInterface.sol';

contract PricesInterfaceTest is PricesInterface {
  uint _eurPrice;
  uint _usdPrice;
  uint _cnyPrice;
  uint _jpyPrice;
  uint _gbpPrice;
  uint _rubPrice;

  function eurPrice() public view returns (uint) { return _eurPrice; }
  function usdPrice() public view returns (uint) { return _usdPrice; }
  function cnyPrice() public view returns (uint) { return _cnyPrice; }
  function jpyPrice() public view returns (uint) { return _jpyPrice; }
  function gbpPrice() public view returns (uint) { return _gbpPrice; }
  function rubPrice() public view returns (uint) { return _rubPrice; }

  function PricesInterfaceTest (
    uint newEurPrice,
    uint newUsdPrice,
    uint newCnyPrice,
    uint newJpyPrice,
    uint newGbpPrice,
    uint newRubPrice
  ) public {
    _eurPrice = newEurPrice;
    _usdPrice = newUsdPrice;
    _cnyPrice = newCnyPrice;
    _jpyPrice = newJpyPrice;
    _gbpPrice = newGbpPrice;
    _rubPrice = newRubPrice;
  }
}

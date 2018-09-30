pragma solidity ^0.4.19;

contract PricesInterface {
  event PricesUpdated(
    uint updateTimestamp,
    uint eurPrice,
    uint usdPrice,
    uint cnyPrice,
    uint jpyPrice,
    uint gbpPrice,
    uint rubPrice
  );

  function eurPrice() public view returns (uint);
  function usdPrice() public view returns (uint);
  function cnyPrice() public view returns (uint);
  function jpyPrice() public view returns (uint);
  function gbpPrice() public view returns (uint);
  function rubPrice() public view returns (uint);
}

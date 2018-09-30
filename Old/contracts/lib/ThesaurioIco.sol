pragma solidity ^0.4.19;

contract ThesaurioIco {
  event AddressDeposited (
    address indexed depositor,
    uint depositedAt,
    uint amount,
    uint tokenAmount,
    bool indexed boughtOnBehalf
  );

  function distributionInfo() public constant returns (
    uint minContrib,
    uint maxContrib,
    uint currentTokenPrice,
    uint currentBonus,
    uint remainingSupply
  );
}

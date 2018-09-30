pragma solidity ^0.4.19;

import "./TrecentoToken.sol";

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";
import "./lib/PricesInterface.sol";
import "./lib/ThesaurioIco.sol";
import "./lib/KycRegistryInterface.sol";

contract TrecentoCrowdsale is Owned, ThesaurioIco {
  using SafeMath for uint256;

  TrecentoToken trecentoToken;
  PricesInterface pricesContract;
  KycRegistryInterface kycRegistry;
  address trecentoWallet;

  uint256 public bonusPerThousandMultiplier = 1200;
  uint256 public tokenPriceInEuroCents = 100;
  uint256 public minimumContributionEuroCents = 1000000;
  uint256 public currentlyRaisedEuroCents;
  uint256 public constant HardCapEuroCents = 5000000000;
  bool public crowdsaleEnabled = false;

  function distributionInfo() public constant returns (
    uint minContrib,
    uint maxContrib,
    uint currentTokenPrice,
    uint currentBonus,
    uint remainingSupply
  ) {
    minContrib = minimumContribution();
    maxContrib = 0;
    currentTokenPrice = tokenPriceInWei();
    currentBonus = bonusPerThousandMultiplier;
    remainingSupply = 0;
  }

  function TrecentoCrowdsale(
    address trecentoTokenAddr,
    address pricesContractAddr,
    address kycRegistryAddr,
    address trecentoWalletAddr
  ) public {
    trecentoToken = TrecentoToken(trecentoTokenAddr);
    pricesContract = PricesInterface(pricesContractAddr);
    kycRegistry = KycRegistryInterface(kycRegistryAddr);
    trecentoWallet = trecentoWalletAddr;
  }

  function changeCrowdsaleSettings(
    uint256 _tokenPriceInEuroCents,
    uint256 _minimumContributionInEuroCents,
    uint256 _bonusPerThousandMultiplier,
    bool _crowdsaleEnabled
  ) public onlyOwner {
    tokenPriceInEuroCents = _tokenPriceInEuroCents;
    minimumContributionEuroCents = _minimumContributionInEuroCents;
    bonusPerThousandMultiplier = _bonusPerThousandMultiplier;
    crowdsaleEnabled = _crowdsaleEnabled;
  }

  function minimumContribution() public constant returns (uint256) {
    return minimumContributionEuroCents * pricesContract.eurPrice();
  }

  modifier mustBeKycCleared(address _address) {
    require(kycRegistry.isAddressCleared(_address));
    _;
  }

  modifier saleMustBeEnabled() {
    require(crowdsaleEnabled);
    _;
  }

  function() public mustBeKycCleared(msg.sender) saleMustBeEnabled payable {
    require(msg.value >= minimumContribution());

    // Checking hard-cap limits
    uint256 euroAmountCents = msg.value.div(pricesContract.eurPrice());
    require(currentlyRaisedEuroCents.add(euroAmountCents) <= HardCapEuroCents);
    currentlyRaisedEuroCents = currentlyRaisedEuroCents.add(euroAmountCents);

    // Distributing token
    uint256 givenAmount = tokenAmount(msg.value);
    makeAllocation(givenAmount, msg.sender);

    // Transfer the money to Trecento Wallet
    trecentoWallet.transfer(msg.value);

    emit AddressDeposited(
      msg.sender,
      block.timestamp,
      msg.value,
      givenAmount,
      false
    );
  }

  function otherCurrencyPayment(
    uint256 euroAmountCents,
    address tokenReceiver
  ) public mustBeKycCleared(tokenReceiver) saleMustBeEnabled onlyOwner {
    // Calculating token amount
    uint256 givenAmount = euroAmountCents
                            .fiatdiv(tokenPriceInEuroCents) // Token amount multiplied by 1e2
                            .mul(bonusPerThousandMultiplier) // Token amount, bonus included, multiplied by 1e5
                            .div(1000) // Token amount, bonus included, multiplied by 1e2
                            .mul(10**16); // Token amount, bonus included, multiplied by 1e18

    // Checking hard-cap limits
    require(currentlyRaisedEuroCents.add(euroAmountCents) <= HardCapEuroCents);
    currentlyRaisedEuroCents = currentlyRaisedEuroCents.add(euroAmountCents);

    // Distributing token
    makeAllocation(givenAmount, tokenReceiver);

    emit AddressDeposited(
      tokenReceiver,
      block.timestamp,
      euroAmountCents.div(tokenPriceInEuroCents).mul(tokenPriceInWei()), // Calculates the equivalent amount of ETH based on known EUR price
      givenAmount,
      true
    );
  }

  function tokenAmount(uint256 etherAmount) public constant returns (uint256) {
    return etherAmount
      .ethdiv(tokenPriceInWei()) // Token amount multiplied by 1e18
      .mul(bonusPerThousandMultiplier) // Token amount, bonus included, multiplied by 1e21
      .div(1000); // Token amount, bonus included, multiplied by 1e18
  }

  function tokenPriceInWei() public constant returns (uint256) {
    return pricesContract.eurPrice().mul(tokenPriceInEuroCents);
  }

  function makeAllocation(uint256 givenTokenAmount, address tokenReceiver) private {
    trecentoToken.forge(tokenReceiver, givenTokenAmount);
  }
}

pragma solidity ^0.4.24;
import "./TOTToken.sol";
import "./SafeMath.sol";
import "./Ownable.sol";


contract Distribute is Ownable{

  using SafeMath for uint256;
  // Token distribution, must sumup to 1000
  uint256 public constant SHARE_PURCHASERS = 75;
  uint256 public constant SHARE_FOUNDATION = 5;
  uint256 public constant SHARE_TEAM = 15;
  uint256 public constant SHARE_BOUNTY = 5;
  TOTToken public token;

  // Wallets addresses
  address public foundationAddress;
  address public teamAddress;
  address public bountyAddress;

  // Versting
  uint256 public releasedTokens;
  uint256 public tokensTorelease;
  uint256 public startVesting;
  uint256 public period1;
	uint256 public period2;
	uint256 public period3;
  uint256 public period4;
  bool public distributed_round1 = false;
  bool public distributed_round2 = false;
  bool public distributed_round3 = false;
  bool public distributed_round4 = false;

  constructor(address _token, address _foundationAddress, address _teamAddress, address _bountyAddress) public {
    require(_token != address(0) && _foundationAddress != address(0) && _teamAddress != address(0) && _bountyAddress != address(0));
    token = TOTToken(_token);
    foundationAddress = _foundationAddress;
    teamAddress = _teamAddress;
    bountyAddress = _bountyAddress;
  }

  function updateWallets(address _foundation, address _team, address _bounty) public onlyOwner {
    require(!token.mintingFinished());
    require(_foundation != address(0) && _team != address(0) && _bounty != address(0));
    foundationAddress = _foundation;
    teamAddress = _team;
    bountyAddress = _bounty;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() public onlyOwner returns (bool) {

    // before calling this method totalSupply includes only purchased tokens
    uint256 total = token.totalSupply().mul(100).div(SHARE_PURCHASERS); //ignore (totalSupply mod 617) ~= 616e-8,

    uint256 foundationTokens = total.mul(SHARE_FOUNDATION).div(100);
    uint256 teamTokens = total.mul(SHARE_TEAM).div(100);
    uint256 bountyTokens = total.mul(SHARE_BOUNTY).div(100);
    require (token.balanceOf(foundationAddress) == 0 && token.balanceOf(address(this)) == 0 && token.balanceOf(bountyAddress) == 0);
    token.mint(foundationAddress, foundationTokens);
    token.mint(address(this), teamTokens);
    token.mint(bountyAddress, bountyTokens);
    tokensTorelease = teamTokens.mul(25).div(100);
    token.finishMinting();

    startVesting = now;
    period1 = startVesting.add(24 weeks);
    period2 = startVesting.add(48 weeks);
    period3 = startVesting.add(72 weeks);
    period4 = startVesting.add(96 weeks);
    return true;
  }

  /**
    * @dev This is an especial owner-only function to make massive tokens minting.
    * @param _data is an array of addresses
    * @param _amount is an array of uint256
  */
  function batchMint(address[] _data,uint256[] _amount) public onlyOwner {
    for (uint i = 0; i < _data.length; i++) {
       token.mint(_data[i],_amount[i]);
    }
  }

  function pauseToken() public onlyOwner {
    token.pause();
  }

  function unpauseToken() public onlyOwner {
    token.unpause();
  }

    function TeamtokenRelease1 ()public onlyOwner {
       require(token.mintingFinished() && !distributed_round1);
    	 require (now >= period1);
       token.transfer(teamAddress,tokensTorelease);
    	 releasedTokens=tokensTorelease;
    	 distributed_round1=true;
    	}

    function TeamtokenRelease2 ()public onlyOwner {
       require(distributed_round1 && !distributed_round2);
    	 require (now >= period2);
    	 token.transfer(teamAddress,tokensTorelease);
    	 releasedTokens=releasedTokens.add(tokensTorelease);
    	 distributed_round2=true;
     }

   function TeamtokenRelease3 ()public onlyOwner {
       require(distributed_round2 && !distributed_round3);
    	 require (now >= period3);
    	 token.transfer(teamAddress,tokensTorelease);
    	 releasedTokens = releasedTokens.add(tokensTorelease);
    	 distributed_round3 = true;
     }

     function TeamtokenRelease4 ()public onlyOwner {
      require(distributed_round3 && !distributed_round4);
      require (now >= period4);
      uint256 balance = token.balanceOf(this);
      token.transfer(teamAddress,balance);
      releasedTokens = releasedTokens.add(balance);
      distributed_round4=true;
    }



}

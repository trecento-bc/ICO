pragma solidity ^0.4.19;

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";
import "./lib/ERC20Interface.sol";
import "./lib/ApproveAndCallFallBack.sol";

contract TrecentoToken is Owned, ERC20Interface {
  using SafeMath for uint256;

  /* ERC20 Attributes */
  mapping(address => uint256) balances;
  mapping(address => mapping (address => uint256)) allowed;
  mapping(address => bool) public freezeBypassing;
  mapping(address => bool) public forgers;

  string public symbol = 'TBCT';
  string public  name = 'TrecentoToken';
  uint8 public decimals = 18;
  uint256 public forgedSupply;
  uint256 public circulatingSupply;
  bool public tradingLive = false;

  event ForgedTokens(uint256 amount, uint256 timestamp);

  /* Forging capability implementation */
  modifier onlyForgers(address forger) {
    require(forgers[forger]);
    _;
  }

  function setForgerStatus(address forger, bool able) public onlyOwner returns (bool success) {
    forgers[forger] = able;
    return true;
  }

  function forge(address to, uint256 tokens) public onlyForgers(msg.sender) returns (bool success) {
    balances[to] = balances[to].add(tokens);
    forgedSupply = forgedSupply.add(tokens);
    emit ForgedTokens(tokens, block.timestamp);
    emit Transfer(address(0), to, tokens);
    return true;
  }
  /* -- */

  /* Freezing capability Implementation */
  function allowFreezeBypass(address sender) public onlyOwner returns (bool success) {
    freezeBypassing[sender] = true;
    return true;
  }

  function setTradingLive() public onlyOwner returns (bool tradingStatus) {
    tradingLive = true;
    return tradingLive;
  }

  modifier tokenTradingMustBeLive(address sender) {
    require(tradingLive || freezeBypassing[sender]);
    _;
  }
  /* -- */

  /* ERC20 Standard Implementation */
  function totalSupply() public constant returns (uint) {
    return forgedSupply;
  }

  function balanceOf(address tokenOwner) public constant returns (uint256 balance) {
    return balances[tokenOwner];
  }

  function transfer(address to, uint256 tokens) public tokenTradingMustBeLive(msg.sender) returns (bool success) {
    balances[msg.sender] = balances[msg.sender].sub(tokens);
    balances[to] = balances[to].add(tokens);
    emit Transfer(msg.sender, to, tokens);
    return true;
  }

  function transferFrom(address from, address to, uint256 tokens) public tokenTradingMustBeLive(from) returns (bool success) {
    balances[from] = balances[from].sub(tokens);
    allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);
    balances[to] = balances[to].add(tokens);
    emit Transfer(from, to, tokens);
    return true;
  }

  function approve(address spender, uint256 tokens) public returns (bool success) {
    allowed[msg.sender][spender] = tokens;
    emit Approval(msg.sender, spender, tokens);
    return true;
  }

  function allowance(address tokenOwner, address spender) public constant returns (uint256 remaining) {
    return allowed[tokenOwner][spender];
  }
  /* -- */

  /* trigger the receiveApproval(...) on spender contract */
  function approveAndCall(address spender, uint256 tokens, bytes data) public returns (bool success) {
    allowed[msg.sender][spender] = tokens;
    emit Approval(msg.sender, spender, tokens);
    ApproveAndCallFallBack(spender).receiveApproval(msg.sender, tokens, this, data);
    return true;
  }

  /* Owner can transfer out any accidentally sent ERC20 tokens */
  function transferAnyERC20Token(address tokenAddress, uint256 tokens) public onlyOwner returns (bool success) {
    return ERC20Interface(tokenAddress).transfer(owner, tokens);
  }
}

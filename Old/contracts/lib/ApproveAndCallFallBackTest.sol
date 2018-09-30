pragma solidity ^0.4.0;

import "./ApproveAndCallFallBack.sol";

contract ApproveAndCallFallBackTest is ApproveAndCallFallBack {
    address public from;
    uint256 public tokens;
    address public token;
    bytes public data;

    function receiveApproval(address _from, uint256 _tokens, address _token, bytes _data) public {
        from = _from;
        tokens = _tokens;
        token = _token;
        data = _data;
    }
}

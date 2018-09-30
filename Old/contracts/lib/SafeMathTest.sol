pragma solidity ^0.4.0;

import "./SafeMath.sol";
contract SafeMathTest {

    using SafeMath for uint;
    function add(uint a, uint b) public pure returns (uint c) {
        c = a.add(b);
    }
    function sub(uint a, uint b) public pure returns (uint c) {
        c = a.sub(b);
    }
    function mul(uint a, uint b) public pure returns (uint c) {
        c = a.mul(b);
    }
    function div(uint a, uint b) public pure returns (uint c) {
        c = a.div(b);
    }
}

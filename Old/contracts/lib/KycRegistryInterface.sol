pragma solidity ^0.4.19;

contract KycRegistryInterface {
    event kycStatusChanged(address indexed _address, uint changeTimestamp, bool toStatus);
    function kycStatusSet(address _address, bool _newKycStatus) public;
    function isAddressCleared(address _address) public constant returns (bool);
}

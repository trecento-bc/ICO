pragma solidity ^0.4.21;

import "./lib/KycRegistryInterface.sol";

contract KycRegistry is KycRegistryInterface {
    address public oracleAddress;
    mapping (address => bool) kycClearances;

    function KycRegistry(address _oracleAddress) public {
        oracleAddress = _oracleAddress;
    }

    modifier onlyOracle() {
        require(msg.sender == oracleAddress);
        _;
    }

    function kycStatusSet(address _address, bool _newKycStatus) public onlyOracle() {
        kycClearances[_address] = _newKycStatus;
        emit kycStatusChanged(_address, block.timestamp, _newKycStatus);
    }

    function updateOracleAddress(address _newOracleAddress) public onlyOracle() {
        oracleAddress = _newOracleAddress;
    }

    function isAddressCleared(address _address) public constant returns (bool) {
        return kycClearances[_address];
    }
}

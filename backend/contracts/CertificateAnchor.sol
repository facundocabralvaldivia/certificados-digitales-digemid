// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CertificateAnchor
/// @notice Ancla de forma inmutable el Merkle Root de cada lote diario de
///         certificados. Solo el owner (wallet institucional) puede anclar.
contract CertificateAnchor {
    address public owner;

    mapping(bytes32 => bytes32) public roots; // batchId => merkleRoot
    mapping(bytes32 => uint256) public anchoredAt; // batchId => timestamp

    event BatchAnchored(bytes32 indexed batchId, bytes32 merkleRoot, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error AlreadyAnchored();
    error ZeroRoot();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function anchorBatch(bytes32 batchId, bytes32 merkleRoot) external onlyOwner {
        if (merkleRoot == bytes32(0)) revert ZeroRoot();
        if (roots[batchId] != bytes32(0)) revert AlreadyAnchored();
        roots[batchId] = merkleRoot;
        anchoredAt[batchId] = block.timestamp;
        emit BatchAnchored(batchId, merkleRoot, block.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

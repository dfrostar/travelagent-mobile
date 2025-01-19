// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TravelBooking is ERC721, ReentrancyGuard, Ownable {
    struct Flight {
        string flightNumber;
        string airline;
        string departureAirport;
        string arrivalAirport;
        uint256 departureTime;
        uint256 price;
        bool isAvailable;
        address agent;
    }

    struct Booking {
        uint256 flightId;
        address passenger;
        string passengerDetails; // IPFS hash containing encrypted passenger data
        BookingStatus status;
        uint256 timestamp;
        address agent;
    }

    enum BookingStatus { Pending, Confirmed, Cancelled, Completed }

    mapping(uint256 => Flight) public flights;
    mapping(uint256 => Booking) public bookings;
    mapping(address => bool) public authorizedAgents;

    uint256 private flightCounter;
    uint256 private bookingCounter;

    event FlightCreated(uint256 indexed flightId, string flightNumber, address agent);
    event BookingCreated(uint256 indexed bookingId, uint256 flightId, address passenger);
    event BookingStatusUpdated(uint256 indexed bookingId, BookingStatus status);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);

    constructor() ERC721("TravelBooking", "TRVL") {}

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }

    function authorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    function createFlight(
        string memory flightNumber,
        string memory airline,
        string memory departureAirport,
        string memory arrivalAirport,
        uint256 departureTime,
        uint256 price
    ) external onlyAuthorizedAgent returns (uint256) {
        flightCounter++;
        flights[flightCounter] = Flight({
            flightNumber: flightNumber,
            airline: airline,
            departureAirport: departureAirport,
            arrivalAirport: arrivalAirport,
            departureTime: departureTime,
            price: price,
            isAvailable: true,
            agent: msg.sender
        });

        emit FlightCreated(flightCounter, flightNumber, msg.sender);
        return flightCounter;
    }

    function createBooking(
        uint256 flightId,
        string memory passengerDetails
    ) external payable nonReentrant returns (uint256) {
        require(flights[flightId].isAvailable, "Flight not available");
        require(msg.value >= flights[flightId].price, "Insufficient payment");

        bookingCounter++;
        bookings[bookingCounter] = Booking({
            flightId: flightId,
            passenger: msg.sender,
            passengerDetails: passengerDetails,
            status: BookingStatus.Pending,
            timestamp: block.timestamp,
            agent: flights[flightId].agent
        });

        // Mint NFT ticket
        _safeMint(msg.sender, bookingCounter);

        emit BookingCreated(bookingCounter, flightId, msg.sender);
        return bookingCounter;
    }

    function updateBookingStatus(
        uint256 bookingId,
        BookingStatus status
    ) external onlyAuthorizedAgent {
        require(bookings[bookingId].agent == msg.sender, "Not booking agent");
        bookings[bookingId].status = status;
        emit BookingStatusUpdated(bookingId, status);
    }

    function getFlightDetails(uint256 flightId) external view returns (Flight memory) {
        return flights[flightId];
    }

    function getBookingDetails(uint256 bookingId) external view returns (Booking memory) {
        return bookings[bookingId];
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

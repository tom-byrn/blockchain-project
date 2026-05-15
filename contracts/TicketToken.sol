// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TicketToken
/// @author Blockchain Technologies and Applications project
/// @notice A simple handwritten ERC-20-compatible ticket token for a Sepolia event ticketing DApp.
/// @dev Each token represents one whole ticket because `decimals` is fixed at 0.
contract TicketToken {
    /// @notice Human-readable token name.
    string public name;

    /// @notice Short token symbol.
    string public symbol;

    /// @notice Number of decimal places used by the token. A value of 0 means one token equals one ticket.
    uint8 public constant decimals = 0;

    /// @notice Total number of tickets minted at deployment.
    uint256 public totalSupply;

    /// @notice Maximum number of tickets that can exist.
    uint256 public immutable maxSupply;

    /// @notice Exact Sepolia ETH price, in wei, required to buy one ticket.
    uint256 public immutable ticketPriceWei;

    /// @notice Venue wallet that initially receives all tickets and receives ticket sale proceeds.
    /// @dev The code keeps the original `vendor` name because it is the deployed contract interface.
    address public immutable vendor;

    /// @dev Token balances by wallet address.
    mapping(address => uint256) private balances;

    /// @dev ERC-20 allowances: token owner => spender => approved amount.
    mapping(address => mapping(address => uint256)) private allowances;

    /// @notice Emitted when tickets move between addresses.
    /// @param from Address sending tickets, or zero address during initial mint.
    /// @param to Address receiving tickets.
    /// @param value Number of whole ticket tokens transferred.
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Emitted when an owner approves a spender to transfer tickets.
    /// @param owner Address granting approval.
    /// @param spender Address allowed to transfer tickets.
    /// @param value Number of whole ticket tokens approved.
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @notice Emitted when a wallet successfully buys one ticket.
    /// @param buyer Wallet that bought the ticket.
    /// @param pricePaid Amount of Sepolia ETH paid in wei.
    event TicketPurchased(address indexed buyer, uint256 pricePaid);

    /// @notice Emitted when a wallet returns one ticket to the venue wallet.
    /// @param holder Wallet that returned the ticket.
    event TicketReturned(address indexed holder);

    /// @notice Deploys the ticket token and mints all tickets to the venue wallet.
    /// @param _name Human-readable token name.
    /// @param _symbol Short token symbol.
    /// @param _vendor Venue wallet that initially receives all tickets and sale proceeds.
    /// @param _ticketPriceWei Exact ticket price in wei.
    /// @param _maxSupply Total number of whole ticket tokens to mint.
    constructor(
        string memory _name,
        string memory _symbol,
        address _vendor,
        uint256 _ticketPriceWei,
        uint256 _maxSupply
    ) {
        require(bytes(_name).length > 0, "Name is required");
        require(bytes(_symbol).length > 0, "Symbol is required");
        require(_vendor != address(0), "Vendor is required");
        require(_ticketPriceWei > 0, "Ticket price is required");
        require(_maxSupply > 0, "Max supply is required");

        name = _name;
        symbol = _symbol;
        vendor = _vendor;
        ticketPriceWei = _ticketPriceWei;
        maxSupply = _maxSupply;
        totalSupply = _maxSupply;

        balances[_vendor] = _maxSupply;
        emit Transfer(address(0), _vendor, _maxSupply);
    }

    /// @notice Returns the ticket balance for a wallet.
    /// @param account Wallet address to inspect.
    /// @return Number of whole ticket tokens held by `account`.
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    /// @notice Returns how many tickets a spender is allowed to transfer from an owner.
    /// @param owner Wallet that owns the tickets.
    /// @param spender Wallet allowed to spend tickets.
    /// @return Remaining approved ticket amount.
    function allowance(address owner, address spender) external view returns (uint256) {
        return allowances[owner][spender];
    }

    /// @notice Transfers tickets from the caller to another wallet.
    /// @param recipient Wallet receiving tickets.
    /// @param amount Number of whole ticket tokens to transfer.
    /// @return True when the transfer succeeds.
    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    /// @notice Approves another wallet to transfer tickets from the caller.
    /// @param spender Wallet receiving the transfer allowance.
    /// @param amount Number of whole ticket tokens approved.
    /// @return True when the approval succeeds.
    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfers tickets from one wallet to another using a prior approval.
    /// @param sender Wallet that owns the tickets.
    /// @param recipient Wallet receiving tickets.
    /// @param amount Number of whole ticket tokens to transfer.
    /// @return True when the transfer succeeds.
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowances[sender][msg.sender];
        require(currentAllowance >= amount, "Transfer exceeds allowance");

        _approve(sender, msg.sender, currentAllowance - amount);
        _transfer(sender, recipient, amount);
        return true;
    }

    /// @notice Buys one ticket using the exact configured Sepolia ETH price.
    /// @dev Transfers one ticket from the venue wallet to the buyer and forwards the payment to the venue wallet.
    function buyTicket() external payable {
        require(msg.value == ticketPriceWei, "Incorrect ticket price");
        require(balances[vendor] >= 1, "No tickets available");

        _transfer(vendor, msg.sender, 1);

        (bool sent, ) = vendor.call{value: msg.value}("");
        require(sent, "Vendor payment failed");

        emit TicketPurchased(msg.sender, msg.value);
    }

    /// @notice Returns one ticket from the caller to the venue wallet.
    /// @dev This is a token return only. It does not refund Sepolia ETH.
    function returnTicket() external {
        _transfer(msg.sender, vendor, 1);
        emit TicketReturned(msg.sender);
    }

    /// @notice Returns the number of tickets still held by the venue wallet.
    /// @return Number of whole ticket tokens still available for purchase or reuse.
    function availableTickets() external view returns (uint256) {
        return balances[vendor];
    }

    /// @dev Moves tickets between two wallets and emits the ERC-20 Transfer event.
    /// @param sender Wallet sending tickets.
    /// @param recipient Wallet receiving tickets.
    /// @param amount Number of whole ticket tokens to move.
    function _transfer(address sender, address recipient, uint256 amount) private {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[sender] >= amount, "Transfer exceeds balance");

        balances[sender] -= amount;
        balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    /// @dev Sets a ticket transfer allowance and emits the ERC-20 Approval event.
    /// @param owner Wallet that owns the tickets.
    /// @param spender Wallet receiving the allowance.
    /// @param amount Number of whole ticket tokens approved.
    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "Approve from zero address");
        require(spender != address(0), "Approve to zero address");

        allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /// @notice Rejects direct Sepolia ETH transfers.
    /// @dev Buyers must call `buyTicket()` so the contract can transfer a ticket.
    receive() external payable {
        revert("Use buyTicket");
    }
}

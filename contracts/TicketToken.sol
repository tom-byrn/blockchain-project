// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TicketToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 0;

    uint256 public totalSupply;
    uint256 public immutable maxSupply;
    uint256 public immutable ticketPriceWei;
    address public immutable vendor;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TicketPurchased(address indexed buyer, uint256 pricePaid);
    event TicketReturned(address indexed holder);

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

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowances[owner][spender];
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowances[sender][msg.sender];
        require(currentAllowance >= amount, "Transfer exceeds allowance");

        _approve(sender, msg.sender, currentAllowance - amount);
        _transfer(sender, recipient, amount);
        return true;
    }

    function buyTicket() external payable {
        require(msg.value == ticketPriceWei, "Incorrect ticket price");
        require(balances[vendor] >= 1, "No tickets available");

        _transfer(vendor, msg.sender, 1);

        (bool sent, ) = vendor.call{value: msg.value}("");
        require(sent, "Vendor payment failed");

        emit TicketPurchased(msg.sender, msg.value);
    }

    function returnTicket() external {
        _transfer(msg.sender, vendor, 1);
        emit TicketReturned(msg.sender);
    }

    function availableTickets() external view returns (uint256) {
        return balances[vendor];
    }

    function _transfer(address sender, address recipient, uint256 amount) private {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[sender] >= amount, "Transfer exceeds balance");

        balances[sender] -= amount;
        balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "Approve from zero address");
        require(spender != address(0), "Approve to zero address");

        allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    receive() external payable {
        revert("Use buyTicket");
    }
}

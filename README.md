# Web3 Ticketing DApp

Static HTML/CSS/JavaScript DApp for a simple ERC-20 ticketing system on the Ethereum Sepolia testnet.

## Project Structure

- `index.html` - tabbed frontend for wallet creation, balance checks, ticket purchase, ticket return, and contract information.
- `css/styles.css` - frontend styling.
- `js/config.js` - Sepolia RPC, contract address, venue wallet address, ticket price, and ABI.
- `js/app.js` - Web3.js wallet, balance, MetaMask, keystore, and transaction logic.
- `contracts/TicketToken.sol` - handwritten ERC-20-compatible ticket token contract.
- `referenceProject/` - uploaded reference project kept for comparison only.

## How to Run

1. Open this folder in Visual Studio Code.
2. Install the VS Code "Live Server" extension if it is not already installed.
3. Right-click `index.html` and choose "Open with Live Server".
4. The app will open in your browser. Internet access is required for the Web3.js CDN and Sepolia RPC calls.

## Deploying the Contract With Remix

1. Open <https://remix.ethereum.org/>.
2. Create a new file named `TicketToken.sol`.
3. Paste in the contents of `contracts/TicketToken.sol`.
4. Compile with Solidity `0.8.20` or newer.
5. Connect MetaMask to Sepolia.
6. Deploy with constructor values similar to:

```text
"Campus Event Ticket", "TICKET", "<venue-wallet-address>", 10000000000000, 100
```

7. Copy the deployed contract address.
8. Update `js/config.js`:

```js
contractAddress: "<deployed-contract-address>",
vendorAddress: "<venue-wallet-address>",
```

9. Reload Live Server and use the "Contract Info" page to confirm the deployed contract values.

## Sepolia Evidence To Collect

Record these links in the external project report:

- Contract deployment transaction.
- Successful `buyTicket()` transaction.
- Sepolia ETH top-up transaction for the contract creator wallet.
- Sepolia ETH top-up transaction for the ticket purchaser wallet.
- Sepolia ETH top-up transaction for the venue wallet.

Use <https://sepolia.etherscan.io/> for transaction and address links.

# Web3 Ticketing DApp

Static HTML/CSS/JavaScript DApp for a simple ERC-20 ticketing system on the Ethereum Sepolia testnet.

## Project Structure

- `index.html` - tabbed frontend for wallet creation, balance checks, ticket purchase, ticket return, and contract information.
- `css/styles.css` - frontend styling.
- `js/config.js` - Sepolia RPC, contract address, venue wallet address, ticket price, and ABI.
- `js/*.js` - frontend configuration, shared state, UI helpers, contract reads, wallet handling, balance checks, and keystore transaction logic.
- `test/` - Node unit tests for the browser JavaScript modules using mocked DOM and Web3 objects.
- `contracts/TicketToken.sol` - handwritten ERC-20-compatible ticket token contract.
- `referenceProject/` - uploaded reference project kept for comparison only.

## How to Run

1. Open this folder in Visual Studio Code or Finder.
2. Open `index.html` directly in your browser.
3. Internet access is required for the Web3.js CDN and Sepolia RPC calls.

## How to Test

Run the dependency-free unit tests with:

```bash
npm test
```

The tests use Node's built-in test runner and mocked browser/Web3 objects, so no local server or Sepolia RPC connection is required.

## Current Sepolia Configuration

The frontend is already configured in `js/config.js` for the deployed Sepolia contract:

- RPC: `https://ethereum-sepolia-rpc.publicnode.com`
- Chain ID: `11155111 / 0xaa36a7`
- Contract: `0xE8d93935b59499b03782b35bFEe1aaaAEa7C7cD5`
- Venue wallet: `0x1a18F2F851BAfDA9e11eA5cC82893F2729a11cC3`
- Ticket price: `10000000000000` wei, or `0.00001` SETH

The constructor arguments used for deployment were:

```text
"Campus Event Ticket", "TICKET", "0x1a18F2F851BAfDA9e11eA5cC82893F2729a11cC3", 10000000000000, 100
```

## Deploying the Contract With Remix

1. Open <https://remix.ethereum.org/>.
2. Create a new file named `TicketToken.sol`.
3. Paste in the contents of `contracts/TicketToken.sol`.
4. Compile with Solidity `0.8.20` or newer.
5. Connect Remix to your Sepolia deployer wallet.
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

9. Reload `index.html` and use the "Contract Info" page to confirm the deployed contract values.

## Sepolia Evidence To Collect

Record these links in the external project report:

- Contract deployment transaction.
- Successful `buyTicket()` transaction.
- Sepolia ETH top-up transaction for the contract creator wallet.
- Sepolia ETH top-up transaction for the ticket purchaser wallet.
- Sepolia ETH top-up transaction for the venue wallet.

Use <https://sepolia.etherscan.io/> for transaction and address links.

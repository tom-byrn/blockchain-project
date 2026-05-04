# Deployment Details

Fill this file in after deploying the contract and testing the DApp on Sepolia.

## Network

- Network: Ethereum Sepolia Testnet
- Chain ID: `11155111`
- RPC used by frontend: `https://ethereum-sepolia-rpc.publicnode.com`
- Explorer: <https://sepolia.etherscan.io/>

## Contract

- Contract name: `TicketToken`
- Contract source: `contracts/TicketToken.sol`
- Deployed contract address: `TODO`
- Deployment transaction link: `TODO`
- Token name: `Campus Event Ticket`
- Token symbol: `TICKET`
- Decimals: `0`
- Ticket price: `10000000000000 wei` / `0.00001 SETH`
- Max ticket supply: `100`

## Wallets

- Contract creator wallet: `TODO`
- Creator Sepolia ETH top-up transaction: `TODO`
- Ticket purchaser wallet: `TODO`
- Purchaser Sepolia ETH top-up transaction: `TODO`
- Vendor / doorman wallet: `TODO`
- Vendor / doorman Sepolia ETH top-up transaction: `TODO`

## Transaction Evidence

- Successful ticket purchase transaction: `TODO`
- Successful ticket return transaction: `TODO`

## Frontend Configuration

After deployment, update `js/config.js` with:

```js
contractAddress: "TODO",
vendorAddress: "TODO",
```

Reload the frontend in Live Server after editing the config.

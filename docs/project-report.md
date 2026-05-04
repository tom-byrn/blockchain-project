# Project Report: Web3 Ticketing DApp

## 1. Project Overview

This project implements a simple Web3 ticketing system on Ethereum Sepolia. Users can create encrypted keystore wallets, check Sepolia ETH and ticket token balances, buy a ticket token using Sepolia ETH, and return a ticket token to the vendor. The frontend is a static HTML/CSS/JavaScript application designed to run with VS Code Live Server. The blockchain backend is a handwritten Solidity ERC-20-compatible smart contract deployed through Remix.

## 2. Code Overview

The frontend is split into `index.html`, `css/styles.css`, `js/config.js`, and `js/app.js`. `index.html` contains the tabbed page structure for contract information, wallet creation, balance checks, purchases, and ticket returns. `css/styles.css` controls the responsive layout and visual styling. `js/config.js` stores Sepolia configuration, the deployed contract address, the vendor wallet, ticket price, and the contract ABI. `js/app.js` contains the Web3.js logic for creating encrypted wallets, downloading keystore files, loading keystore wallets, connecting MetaMask, checking balances, and sending transactions.

The smart contract is `contracts/TicketToken.sol`. It implements the main ERC-20 functions and events manually: `totalSupply`, `balanceOf`, `allowance`, `transfer`, `approve`, `transferFrom`, `Transfer`, and `Approval`. It also adds ticket-specific functions: `buyTicket()`, `returnTicket()`, and `availableTickets()`.

## 3. Design Description

The DApp is organised as a tabbed single-page application so each required feature is easy to find. The "Create Wallet" page focuses on the encrypted keystore requirement and hides the private key by default. The "Check Balances" page supports attendee, doorman, and venue use cases by allowing any wallet address to be checked while also showing ticket distribution information. The "Buy Ticket" and "Return Ticket" pages support both MetaMask and keystore signing, which makes the app useful for normal wallet users while still demonstrating browser-based wallet creation and keystore use.

The smart contract models the vendor as the initial holder of all tickets. Buying a ticket transfers one ticket from the vendor to the purchaser and forwards Sepolia ETH payment to the vendor. Returning a ticket transfers one ticket from the holder back to the vendor without a refund.

## 4. Smart Contract Deployment

- Contract address: `TODO`
- Deployment transaction: `TODO`
- Contract creator wallet: `TODO`
- Vendor / doorman wallet: `TODO`
- Ticket purchaser wallet: `TODO`

## 5. Sepolia Transaction Evidence

- Successful deployment transaction: `TODO`
- Successful `buyTicket()` transaction: `TODO`
- Contract creator top-up transaction: `TODO`
- Ticket purchaser top-up transaction: `TODO`
- Vendor / doorman top-up transaction: `TODO`
- Successful `returnTicket()` transaction: `TODO`

## 6. Testing Summary

Test the following before submission:

- Create a wallet with a password and download the encrypted keystore JSON.
- Reload the keystore with the correct password and confirm that an incorrect password is rejected.
- Check Sepolia ETH and ticket token balances for the purchaser wallet.
- Check the vendor / doorman wallet and confirm it starts with the full ticket supply.
- Buy one ticket and confirm the purchaser balance increases by one.
- Confirm the vendor ticket balance decreases by one after purchase.
- Return one ticket and confirm the purchaser balance decreases and vendor balance increases.
- Copy all relevant Etherscan transaction links into this report.

## 7. Limitations

This project is for a testnet assignment and uses Sepolia ETH only. Keystore private keys are decrypted in the browser for educational purposes, so generated wallets should not be used for real funds. Ticket returns transfer tokens back to the vendor but do not refund Sepolia ETH.

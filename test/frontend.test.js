const assert = require("node:assert/strict");
const test = require("node:test");

const { createTestApp } = require("./support/browserHarness");

test("tab navigation clears stale app messages", async () => {
  const { getById, tabs, triggerDOMContentLoaded } = createTestApp();
  await triggerDOMContentLoaded();

  await getById("useCreatedWalletForBalanceButton").click();
  assert.equal(getById("appMessage").textContent, "Create a wallet first.");
  assert.equal(getById("appMessage").className, "app-message error");
  assert.equal(getMessageDismissButton(getById("appMessage")).getAttribute("aria-label"), "Dismiss message");

  await tabs.find((tab) => tab.dataset.tab === "returnTicket").click();

  assert.equal(getById("appMessage").textContent, "");
  assert.equal(getById("appMessage").className, "app-message");
  assert.equal(getById("returnTicket").classList.contains("active"), true);
});

test("message dismiss button clears the current app message", async () => {
  const { app, getById, triggerDOMContentLoaded } = createTestApp();
  await triggerDOMContentLoaded();

  await getById("useCreatedWalletForBalanceButton").click();
  const message = getById("appMessage");

  assert.equal(message.textContent, "Create a wallet first.");
  assert.equal(message.children.length, 2);
  assert.equal(message.children[0].className, "app-message-text");
  assert.equal(message.children[1].className, "app-message-dismiss");

  await getMessageDismissButton(message).click();

  assert.equal(message.textContent, "");
  assert.equal(message.className, "app-message");
  assert.equal(message.children.length, 0);

  app.ui.showMessage("Ticket purchase confirmed on Sepolia.", "success");

  assert.equal(message.textContent, "Ticket purchase confirmed on Sepolia.");
  assert.equal(message.className, "app-message success");

  await getMessageDismissButton(message).click();

  assert.equal(message.textContent, "");
  assert.equal(message.className, "app-message");
});

test("wallet creation validates passwords and renders keystore details", async () => {
  const { app, getById, triggerDOMContentLoaded } = createTestApp({
    createdAccount: {
      address: "0x1111111111111111111111111111111111111111",
      privateKey: "0xabc123"
    }
  });
  await triggerDOMContentLoaded();

  getById("walletPassword").value = "secret-one";
  getById("walletPasswordConfirm").value = "secret-two";
  await getById("createWalletForm").submit();

  assert.equal(getById("appMessage").textContent, "The keystore passwords do not match. Re-enter the same password in both fields before creating the wallet.");
  assert.equal(app.state.createdWallet, null);

  getById("walletPasswordConfirm").value = "secret-one";
  await getById("createWalletForm").submit();

  assert.equal(app.state.createdWallet.address, "0x1111111111111111111111111111111111111111");
  assert.equal(getById("createdWalletAddress").value, "0x1111111111111111111111111111111111111111");
  assert.equal(getById("createdPrivateKey").value, "0xabc123");
  assert.equal(getById("createdPrivateKey").type, "password");
  assert.equal(getById("downloadKeystoreButton").disabled, false);
  assert.equal(getById("balanceAddress").value, "0x1111111111111111111111111111111111111111");
  assert.match(getById("createdKeystore").value, /"cipher": "mock"/);

  await getById("togglePrivateKeyButton").click();

  assert.equal(getById("createdPrivateKey").type, "text");
  assert.equal(getById("togglePrivateKeyButton").textContent, "Hide");
});

test("balance checker gives specific messages for empty and malformed addresses", async () => {
  const { getById, triggerDOMContentLoaded } = createTestApp();
  await triggerDOMContentLoaded();

  getById("balanceAddress").value = "";
  await getById("checkBalanceButton").click();

  assert.equal(getById("appMessage").textContent, "Enter the wallet address you want to check.");

  getById("balanceAddress").value = "not-a-wallet";
  await getById("checkBalanceButton").click();

  assert.equal(getById("appMessage").textContent, "Wallet address \"not-a-wallet\" is not valid. Ethereum addresses must start with 0x and contain 40 hexadecimal characters.");
});

test("balance checker reads SETH, ticket balance, and distribution", async () => {
  const { calls, getById, triggerDOMContentLoaded } = createTestApp({
    balanceWei: "431000000000000000",
    contractValues: {
      ticketBalance: "1",
      totalSupply: "100",
      available: "99"
    }
  });
  await triggerDOMContentLoaded();

  getById("balanceAddress").value = "0x2222222222222222222222222222222222222222";
  await getById("checkBalanceButton").click();

  assert.equal(calls.getBalanceAddress, "0x2222222222222222222222222222222222222222");
  assert.equal(calls.balanceOfAddress, "0x2222222222222222222222222222222222222222");
  assert.equal(getById("balanceWalletResult").textContent, "0x2222...2222");
  assert.equal(getById("cryptoBalanceResult").textContent, "0.431 SETH");
  assert.equal(getById("ticketBalanceResult").textContent, "1 ticket");
  assert.equal(getById("distributionResult").textContent, "1 sold, 99 available");
  assert.equal(getById("appMessage").textContent, "Wallet balance check completed.");
});

test("balance checker explains Sepolia read failures", async () => {
  const { getById, triggerDOMContentLoaded } = createTestApp({
    balanceError: new Error("Sepolia RPC unavailable")
  });
  await triggerDOMContentLoaded();

  getById("balanceAddress").value = "0x5555555555555555555555555555555555555555";
  await getById("checkBalanceButton").click();

  assert.equal(getById("appMessage").textContent, "Could not read SETH or ticket balances for 0x5555...5555 from Sepolia. Sepolia RPC unavailable");
});

test("keystore loading explains missing and incorrect passwords", async () => {
  const { getById, triggerDOMContentLoaded } = createTestApp({
    decryptError: new Error("Key derivation failed - possibly wrong password")
  });
  await triggerDOMContentLoaded();

  getById("buyKeystoreFile").files = [{ text: async () => "{\"version\":3}" }];
  getById("buyKeystorePassword").value = "";
  await getById("loadBuyKeystoreButton").click();

  assert.equal(getById("appMessage").textContent, "Enter the password for the selected purchase wallet keystore.");

  getById("buyKeystorePassword").value = "wrong-password";
  await getById("loadBuyKeystoreButton").click();

  assert.equal(getById("appMessage").textContent, "Could not decrypt the purchase wallet keystore. Check that the file belongs to this wallet and that the password is correct.");
});

test("contract info refresh renders deployed token details", async () => {
  const { app, getById, triggerDOMContentLoaded } = createTestApp({
    contractValues: {
      name: "Campus Event Ticket",
      symbol: "TICKET",
      totalSupply: "100",
      maxSupply: "100",
      available: "97",
      ticketPriceWei: "25000000000000"
    }
  });
  await triggerDOMContentLoaded();

  await app.contract.refreshContractInfo();

  assert.equal(getById("statTokenName").textContent, "Campus Event Ticket (TICKET)");
  assert.equal(getById("statTotalSupply").textContent, "100 / max 100");
  assert.equal(getById("statAvailableTickets").textContent, "97");
  assert.equal(getById("statSoldTickets").textContent, "3");
  assert.equal(getById("ticketPriceText").textContent, "0.000025 SETH (25000000000000 wei)");
  assert.equal(getById("appMessage").textContent, "Contract data loaded successfully.");
});

test("buyWithKeystore signs and sends a contract transaction with ticket price", async () => {
  const buyer = "0x3333333333333333333333333333333333333333";
  const { app, calls, getById, triggerDOMContentLoaded } = createTestApp({
    buyGas: "50000",
    gasPrice: "42",
    nonce: 9,
    receipt: { transactionHash: "0xabc" },
    contractValues: {
      ticketPriceWei: "10000000000000"
    }
  });
  await triggerDOMContentLoaded();
  app.state.buyKeystoreAccount = {
    address: buyer,
    privateKey: "0xbuyer-private-key"
  };

  await app.transactions.buyWithKeystore();

  assert.deepEqual(toPlainObject(calls.estimateGas[0]), {
    name: "buyTicket",
    args: {
      from: buyer,
      value: "10000000000000"
    }
  });
  assert.deepEqual(toPlainObject(calls.signedTransactions[0].tx), {
    from: buyer,
    to: app.config.contractAddress,
    data: "0xbuy",
    value: "10000000000000",
    gas: 60000,
    gasPrice: "42",
    nonce: 9,
    chainId: 11155111
  });
  assert.equal(calls.signedTransactions[0].privateKey, "0xbuyer-private-key");
  assert.deepEqual(calls.sentTransactions, ["0xsigned"]);
  assert.match(getById("buyTransactionRequest").value, /"data": "0xbuy"/);
  assert.match(getById("buyExplorerLink").innerHTML, /0xabc/);
  assert.equal(getById("appMessage").textContent, "Ticket purchase confirmed on Sepolia.");
});

test("returnWithKeystore explains the updated ticket state after return", async () => {
  const attendee = "0x4444444444444444444444444444444444444444";
  const { app, calls, getById, triggerDOMContentLoaded } = createTestApp({
    gasPrice: "42",
    nonce: 10,
    receipt: { transactionHash: "0xreturnhash" }
  });
  await triggerDOMContentLoaded();
  app.state.returnKeystoreAccount = {
    address: attendee,
    privateKey: "0xattendee-private-key"
  };

  await app.transactions.returnWithKeystore();

  assert.deepEqual(toPlainObject(calls.estimateGas[0]), {
    name: "returnTicket",
    args: {
      from: attendee,
      value: "0"
    }
  });
  assert.match(getById("returnTransactionRequest").value, /"data": "0xreturn"/);
  assert.match(getById("returnExplorerLink").innerHTML, /0xreturnhash/);
  assert.equal(getById("appMessage").textContent, "Ticket return confirmed on Sepolia. One ticket was transferred back to the venue wallet, so the attendee wallet has one fewer ticket and venue inventory has increased by one.");
});

function toPlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function getMessageDismissButton(message) {
  return message.children.find((child) => child.className === "app-message-dismiss");
}

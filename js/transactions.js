(function () {
  "use strict";

  const app = window.TicketDapp;

  async function loadBuyKeystore() {
    try {
      app.state.buyKeystoreAccount = await app.wallet.decryptKeystore("buyKeystoreFile", "buyKeystorePassword");
      app.ui.byId("buyLoadedAddress").value = app.state.buyKeystoreAccount.address;
      app.ui.showMessage("Purchase keystore loaded. The private key stays in browser memory only.", "success");
    } catch (error) {
      app.ui.showMessage(error.message, "error");
    }
  }

  async function loadReturnKeystore() {
    try {
      app.state.returnKeystoreAccount = await app.wallet.decryptKeystore("returnKeystoreFile", "returnKeystorePassword");
      app.ui.byId("returnLoadedAddress").value = app.state.returnKeystoreAccount.address;
      app.ui.showMessage("Return keystore loaded. The private key stays in browser memory only.", "success");
    } catch (error) {
      app.ui.showMessage(error.message, "error");
    }
  }

  async function buyWithKeystore() {
    try {
      app.contract.requireContractConfig();
      if (!app.state.buyKeystoreAccount) {
        throw new Error("Load a purchase keystore before buying.");
      }

      app.ui.showMessage("Signing and sending purchase transaction...", "");
      const contract = app.contract.readContract();
      const method = contract.methods.buyTicket();
      const ticketPriceWei = await app.contract.getTicketPriceWei();
      const tx = await buildSignedMethodTransaction(app.state.buyKeystoreAccount.address, method, ticketPriceWei);
      const receipt = await signAndSend(tx, app.state.buyKeystoreAccount.privateKey);

      renderTransaction("buy", tx, receipt);
      app.ui.showMessage("Ticket purchase confirmed on Sepolia.", "success");
      refreshContractInfoInBackground();
    } catch (error) {
      app.ui.showMessage(app.ui.normalizeProviderError(error), "error");
    }
  }

  async function returnWithKeystore() {
    try {
      app.contract.requireContractConfig();
      if (!app.state.returnKeystoreAccount) {
        throw new Error("Load a return keystore before returning a ticket.");
      }

      app.ui.showMessage("Signing and sending return transaction...", "");
      const contract = app.contract.readContract();
      const method = contract.methods.returnTicket();
      const tx = await buildSignedMethodTransaction(app.state.returnKeystoreAccount.address, method, "0");
      const receipt = await signAndSend(tx, app.state.returnKeystoreAccount.privateKey);

      renderTransaction("return", tx, receipt);
      app.ui.showMessage("Ticket return confirmed on Sepolia. One ticket was transferred back to the venue wallet, so the attendee wallet has one fewer ticket and venue inventory has increased by one.", "success");
      refreshContractInfoInBackground();
    } catch (error) {
      app.ui.showMessage(app.ui.normalizeProviderError(error), "error");
    }
  }

  async function buildSignedMethodTransaction(from, method, valueWei) {
    const data = method.encodeABI();
    const base = {
      from,
      to: app.config.contractAddress,
      data,
      value: valueWei
    };

    const [gas, gasPrice, nonce] = await Promise.all([
      estimateMethodGas(method, from, valueWei),
      app.state.readWeb3.eth.getGasPrice(),
      app.state.readWeb3.eth.getTransactionCount(from, "pending")
    ]);
    const gasWithBuffer = Math.ceil(Number(gas) * 1.2);

    return {
      ...base,
      gas: gasWithBuffer,
      gasPrice,
      nonce,
      chainId: app.config.chainId
    };
  }

  async function estimateMethodGas(method, from, valueWei) {
    try {
      return await method.estimateGas({ from, value: valueWei });
    } catch (error) {
      throw new Error(`Transaction cannot be estimated: ${app.ui.normalizeProviderError(error)}`);
    }
  }

  async function signAndSend(tx, privateKey) {
    const signed = await app.state.readWeb3.eth.accounts.signTransaction(tx, privateKey);
    return app.state.readWeb3.eth.sendSignedTransaction(signed.rawTransaction);
  }

  function refreshContractInfoInBackground() {
    app.contract.refreshContractInfo({ silent: true }).catch((error) => {
      console.warn("Contract data refresh failed after transaction.", error);
    });
  }

  function renderTransaction(context, request, receipt) {
    app.ui.byId(`${context}TransactionRequest`).value = JSON.stringify(request, null, 2);
    app.ui.byId(`${context}TransactionResult`).value = JSON.stringify(receipt, null, 2);

    const hash = receipt.transactionHash;
    const linkContainer = app.ui.byId(`${context}ExplorerLink`);
    linkContainer.replaceChildren();

    if (hash) {
      const link = document.createElement("a");
      link.setAttribute("href", `${app.config.explorerBaseUrl}/tx/${hash}`);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer");
      link.textContent = "View transaction on Sepolia Etherscan";
      linkContainer.appendChild(link);
    } else {
      linkContainer.textContent = "Transaction submitted, but no hash was returned.";
    }
  }

  app.transactions = {
    loadBuyKeystore,
    loadReturnKeystore,
    buyWithKeystore,
    returnWithKeystore
  };
})();

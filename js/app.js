(function () {
  "use strict";

  const app = window.TicketDapp;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.Web3) {
      app.ui.showMessage("Web3.js did not load. Check your internet connection and refresh the page.", "error");
      return;
    }

    app.state.readWeb3 = new Web3(app.config.rpcUrl);
    app.ui.bindTabs();
    bindActions();
    app.ui.renderStaticConfig();
    app.ui.updateConfigStatus();
  }

  function bindActions() {
    const ui = app.ui;

    ui.byId("refreshContractButton").addEventListener("click", app.contract.refreshContractInfo);

    ui.byId("createWalletForm").addEventListener("submit", app.wallet.createWallet);
    ui.byId("downloadKeystoreButton").addEventListener("click", app.wallet.downloadCreatedKeystore);
    ui.byId("togglePrivateKeyButton").addEventListener("click", app.wallet.togglePrivateKey);

    ui.byId("checkBalanceButton").addEventListener("click", app.balances.checkBalances);
    ui.byId("useCreatedWalletForBalanceButton").addEventListener("click", app.balances.useCreatedWalletForBalance);
    ui.byId("checkVendorBalanceButton").addEventListener("click", app.balances.checkVendorBalance);

    ui.byId("loadBuyKeystoreButton").addEventListener("click", app.transactions.loadBuyKeystore);
    ui.byId("buyWithKeystoreButton").addEventListener("click", app.transactions.buyWithKeystore);

    ui.byId("loadReturnKeystoreButton").addEventListener("click", app.transactions.loadReturnKeystore);
    ui.byId("returnWithKeystoreButton").addEventListener("click", app.transactions.returnWithKeystore);
  }
})();

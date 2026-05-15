(function () {
  "use strict";

  const app = window.TicketDapp;

  function useCreatedWalletForBalance() {
    if (!app.state.createdWallet) {
      app.ui.showMessage("Create a wallet first.", "error");
      return;
    }

    app.ui.byId("balanceAddress").value = app.state.createdWallet.address;
    app.ui.showMessage("Created wallet address copied into the balance checker.", "success");
  }

  function checkVendorBalance() {
    if (!app.contract.isConfiguredAddress(app.config.vendorAddress)) {
      app.ui.showMessage("Add the vendor wallet address to js/config.js first.", "error");
      return;
    }

    app.ui.byId("balanceAddress").value = app.config.vendorAddress;
    checkBalances();
  }

  async function checkBalances() {
    const ui = app.ui;
    const address = ui.byId("balanceAddress").value.trim();

    if (!Web3.utils.isAddress(address)) {
      ui.showMessage(getWalletAddressValidationMessage(address), "error");
      return;
    }

    try {
      ui.showMessage("Checking wallet balances on Sepolia...", "");
      const balanceWei = await app.state.readWeb3.eth.getBalance(address);
      ui.byId("balanceWalletResult").textContent = ui.shortenAddress(address);
      ui.byId("cryptoBalanceResult").textContent = `${ui.formatWei(balanceWei)} SETH`;

      if (!app.contract.isConfiguredAddress(app.config.contractAddress)) {
        ui.byId("ticketBalanceResult").textContent = "Contract not configured";
        ui.byId("distributionResult").textContent = "Deploy first";
        ui.showMessage("SETH balance loaded. Add the contract address to js/config.js to load ticket balances.", "success");
        return;
      }

      const contract = app.contract.readContract();
      const [ticketBalance, totalSupply, available] = await Promise.all([
        contract.methods.balanceOf(address).call(),
        contract.methods.totalSupply().call(),
        contract.methods.availableTickets().call()
      ]);
      const sold = (BigInt(totalSupply) - BigInt(available)).toString();

      ui.byId("ticketBalanceResult").textContent = `${ticketBalance} ticket${ticketBalance === "1" ? "" : "s"}`;
      ui.byId("distributionResult").textContent = `${sold} sold, ${available} available`;
      ui.showMessage("Wallet balance check completed.", "success");
    } catch (error) {
      ui.showMessage(`Could not read SETH or ticket balances for ${ui.shortenAddress(address)} from Sepolia. ${ui.normalizeProviderError(error)}`, "error");
    }
  }

  function getWalletAddressValidationMessage(address) {
    if (!address) {
      return "Enter the wallet address you want to check.";
    }

    return `Wallet address "${address}" is not valid. Ethereum addresses must start with 0x and contain 40 hexadecimal characters.`;
  }

  app.balances = {
    useCreatedWalletForBalance,
    checkVendorBalance,
    checkBalances
  };
})();

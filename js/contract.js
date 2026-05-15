(function () {
  "use strict";

  const app = window.TicketDapp;

  function isConfiguredAddress(address) {
    return Boolean(address) && address !== app.ZERO_ADDRESS && Web3.utils.isAddress(address);
  }

  function requireContractConfig() {
    if (!isConfiguredAddress(app.config.contractAddress)) {
      throw new Error("Contract address is missing. Deploy TicketToken.sol and update js/config.js.");
    }
  }

  function readContract() {
    requireContractConfig();
    return new app.state.readWeb3.eth.Contract(app.config.abi, app.config.contractAddress);
  }

  async function refreshContractInfo() {
    const ui = app.ui;

    try {
      ui.showMessage("Reading contract data from Sepolia...", "");
      const contract = readContract();
      const [tokenName, tokenSymbol, totalSupply, maxSupply, available, ticketPrice, vendor] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
        contract.methods.maxSupply().call(),
        contract.methods.availableTickets().call(),
        contract.methods.ticketPriceWei().call(),
        contract.methods.vendor().call()
      ]);

      const sold = (BigInt(totalSupply) - BigInt(available)).toString();
      ui.byId("statTokenName").textContent = `${tokenName} (${tokenSymbol})`;
      ui.byId("statTotalSupply").textContent = `${totalSupply} / max ${maxSupply}`;
      ui.byId("statAvailableTickets").textContent = available;
      ui.byId("statSoldTickets").textContent = sold;
      ui.byId("ticketPriceText").textContent = `${ui.formatWei(ticketPrice)} SETH (${ticketPrice} wei)`;
      app.config.ticketPriceWei = ticketPrice;

      if (!isConfiguredAddress(app.config.vendorAddress)) {
        app.config.vendorAddress = vendor;
        ui.setAddressLink("vendorAddressLink", vendor, "address");
        ui.updateConfigStatus();
      }

      ui.showMessage("Contract data loaded successfully.", "success");
    } catch (error) {
      ui.showMessage(error.message, "error");
    }
  }

  async function getTicketPriceWei() {
    try {
      const price = await readContract().methods.ticketPriceWei().call();
      app.config.ticketPriceWei = price;
      app.ui.byId("ticketPriceText").textContent = `${app.ui.formatWei(price)} SETH (${price} wei)`;
      return price;
    } catch (error) {
      throw new Error(`Could not read the current ticket price from Sepolia. ${app.ui.normalizeProviderError(error)}`);
    }
  }

  app.contract = {
    isConfiguredAddress,
    requireContractConfig,
    readContract,
    refreshContractInfo,
    getTicketPriceWei
  };
})();

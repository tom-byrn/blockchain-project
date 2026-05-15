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

  function getCachedContractInfo() {
    const cache = app.state.contractInfoCache;
    if (!cache || cache.contractAddress !== app.config.contractAddress) {
      return null;
    }

    return cache;
  }

  function mergeContractInfoCache(values) {
    const currentCache = getCachedContractInfo() || {};
    app.state.contractInfoCache = {
      ...currentCache,
      ...values,
      contractAddress: app.config.contractAddress
    };

    return app.state.contractInfoCache;
  }

  function hasCompleteStaticContractInfo(cache) {
    return Boolean(
      cache &&
        cache.tokenName &&
        cache.tokenSymbol &&
        cache.totalSupply !== undefined &&
        cache.maxSupply !== undefined &&
        cache.ticketPrice !== undefined &&
        cache.vendor
    );
  }

  async function readContractInfo() {
    const contract = readContract();
    const cachedInfo = getCachedContractInfo();

    if (hasCompleteStaticContractInfo(cachedInfo)) {
      const available = await contract.methods.availableTickets().call();
      return mergeContractInfoCache({ available });
    }

    const [tokenName, tokenSymbol, totalSupply, maxSupply, available, ticketPrice, vendor] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.totalSupply().call(),
      contract.methods.maxSupply().call(),
      contract.methods.availableTickets().call(),
      contract.methods.ticketPriceWei().call(),
      contract.methods.vendor().call()
    ]);

    return mergeContractInfoCache({
      tokenName,
      tokenSymbol,
      totalSupply,
      maxSupply,
      available,
      ticketPrice,
      vendor
    });
  }

  function renderContractInfo(info) {
    const ui = app.ui;
    const sold = (BigInt(info.totalSupply) - BigInt(info.available)).toString();

    ui.byId("statTokenName").textContent = `${info.tokenName} (${info.tokenSymbol})`;
    ui.byId("statTotalSupply").textContent = `${info.totalSupply} / max ${info.maxSupply}`;
    ui.byId("statAvailableTickets").textContent = info.available;
    ui.byId("statSoldTickets").textContent = sold;
    ui.byId("ticketPriceText").textContent = `${ui.formatWei(info.ticketPrice)} SETH (${info.ticketPrice} wei)`;
    app.config.ticketPriceWei = info.ticketPrice;

    if (!isConfiguredAddress(app.config.vendorAddress)) {
      app.config.vendorAddress = info.vendor;
      ui.setAddressLink("vendorAddressLink", info.vendor, "address");
      ui.updateConfigStatus();
    }
  }

  async function refreshContractInfo(options = {}) {
    const ui = app.ui;
    const isSilent = options.silent === true;

    try {
      if (!isSilent) {
        ui.showMessage("Reading contract data from Sepolia...", "");
      }

      const info = await readContractInfo();
      renderContractInfo(info);

      if (!isSilent) {
        ui.showMessage("Contract data loaded successfully.", "success");
      }
    } catch (error) {
      if (isSilent) {
        console.warn("Contract data refresh failed.", error);
        return;
      }

      ui.showMessage(error.message, "error");
    }
  }

  async function getTicketPriceWei() {
    const cachedInfo = getCachedContractInfo();
    if (cachedInfo && cachedInfo.ticketPrice !== undefined) {
      return cachedInfo.ticketPrice;
    }

    try {
      const price = await readContract().methods.ticketPriceWei().call();
      mergeContractInfoCache({ ticketPrice: price });
      app.ui.byId("ticketPriceText").textContent = `${app.ui.formatWei(price)} SETH (${price} wei)`;
      app.config.ticketPriceWei = price;
      return price;
    } catch (error) {
      throw new Error(`Could not read the current ticket price from Sepolia. ${app.ui.normalizeProviderError(error)}`);
    }
  }

  async function getTotalSupply(contract) {
    const cachedInfo = getCachedContractInfo();
    if (cachedInfo && cachedInfo.totalSupply !== undefined) {
      return cachedInfo.totalSupply;
    }

    const totalSupply = await (contract || readContract()).methods.totalSupply().call();
    mergeContractInfoCache({ totalSupply });
    return totalSupply;
  }

  app.contract = {
    isConfiguredAddress,
    requireContractConfig,
    readContract,
    refreshContractInfo,
    getTicketPriceWei,
    getTotalSupply,
    getCachedContractInfo
  };
})();

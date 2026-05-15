(function () {
  "use strict";

  const app = window.TicketDapp;

  function byId(id) {
    return document.getElementById(id);
  }

  function bindTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        const isChangingTab = !button.classList.contains("active");
        document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

        button.classList.add("active");
        byId(button.dataset.tab).classList.add("active");

        if (isChangingTab) {
          clearMessage();
        }
      });
    });
  }

  function showMessage(message, type) {
    const box = byId("appMessage");
    box.className = `app-message ${type || ""}`.trim();
    box.replaceChildren();

    if (!message) {
      return;
    }

    const messageText = document.createElement("span");
    messageText.className = "app-message-text";
    messageText.textContent = message;

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.className = "app-message-dismiss";
    dismissButton.setAttribute("aria-label", "Dismiss message");
    dismissButton.addEventListener("click", clearMessage);

    box.appendChild(messageText);
    box.appendChild(dismissButton);
  }

  function clearMessage() {
    showMessage("", "");
  }

  function renderStaticConfig() {
    const config = app.config;

    byId("sidebarNetwork").textContent = `${config.networkName} (${config.chainId})`;
    byId("rpcUrlText").textContent = config.rpcUrl;
    byId("chainIdText").textContent = `${config.chainId} / ${config.chainIdHex}`;
    byId("ticketPriceText").textContent = `${formatWei(config.ticketPriceWei)} SETH (${config.ticketPriceWei} wei)`;
    setAddressLink("contractAddressLink", config.contractAddress, "address");
    setAddressLink("vendorAddressLink", config.vendorAddress, "address");
  }

  function updateConfigStatus() {
    const status = byId("configStatus");
    if (app.contract.isConfiguredAddress(app.config.contractAddress) && app.contract.isConfiguredAddress(app.config.vendorAddress)) {
      status.textContent = "Contract configured";
      status.classList.add("ready");
      return;
    }

    status.textContent = "Add deployment details";
    status.classList.remove("ready");
    showMessage("Deploy the Solidity contract in Remix, then update js/config.js with the contract and venue wallet addresses.", "error");
  }

  function setAddressLink(id, address, type) {
    const link = byId(id);
    if (!app.contract.isConfiguredAddress(address)) {
      link.textContent = "Not configured";
      link.removeAttribute("href");
      return;
    }

    link.textContent = address;
    link.href = `${app.config.explorerBaseUrl}/${type}/${address}`;
  }

  function formatWei(valueWei) {
    if (!valueWei && valueWei !== "0") {
      return "-";
    }

    const web3 = app.state.readWeb3 || Web3;
    const ether = web3.utils.fromWei(valueWei.toString(), "ether");
    const numberValue = Number(ether);
    if (!Number.isFinite(numberValue)) {
      return ether;
    }

    return numberValue.toLocaleString(undefined, {
      maximumFractionDigits: 8
    });
  }

  function shortenAddress(address) {
    if (!address || address.length < 12) {
      return address || "-";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function normalizeProviderError(error) {
    if (!error) {
      return "An unknown error occurred.";
    }

    if (error.message) {
      return error.message.replace("Returned error: ", "");
    }

    return String(error);
  }

  app.ui = {
    byId,
    bindTabs,
    showMessage,
    clearMessage,
    renderStaticConfig,
    updateConfigStatus,
    setAddressLink,
    formatWei,
    shortenAddress,
    normalizeProviderError
  };
})();

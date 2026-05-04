(function () {
  "use strict";

  const CONFIG = window.TICKET_DAPP_CONFIG;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  let readWeb3;
  let createdWallet = null;
  let createdKeystoreJson = "";
  let buyKeystoreAccount = null;
  let returnKeystoreAccount = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.Web3) {
      showMessage("Web3.js did not load. Check your internet connection and refresh Live Server.", "error");
      return;
    }

    readWeb3 = new Web3(CONFIG.rpcUrl);
    bindTabs();
    bindActions();
    renderStaticConfig();
    updateConfigStatus();
  }

  function bindTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

        button.classList.add("active");
        document.getElementById(button.dataset.tab).classList.add("active");
      });
    });
  }

  function bindActions() {
    byId("connectMetaMaskButton").addEventListener("click", connectMetaMaskClick);
    byId("refreshContractButton").addEventListener("click", refreshContractInfo);

    byId("createWalletForm").addEventListener("submit", createWallet);
    byId("downloadKeystoreButton").addEventListener("click", downloadCreatedKeystore);
    byId("togglePrivateKeyButton").addEventListener("click", togglePrivateKey);

    byId("checkBalanceButton").addEventListener("click", checkBalances);
    byId("useMetaMaskForBalanceButton").addEventListener("click", useMetaMaskForBalance);
    byId("useCreatedWalletForBalanceButton").addEventListener("click", useCreatedWalletForBalance);
    byId("useVendorForBalanceButton").addEventListener("click", useVendorForBalance);

    byId("loadBuyKeystoreButton").addEventListener("click", loadBuyKeystore);
    byId("buyWithKeystoreButton").addEventListener("click", buyWithKeystore);
    byId("buyWithMetaMaskButton").addEventListener("click", buyWithMetaMask);

    byId("loadReturnKeystoreButton").addEventListener("click", loadReturnKeystore);
    byId("returnWithKeystoreButton").addEventListener("click", returnWithKeystore);
    byId("returnWithMetaMaskButton").addEventListener("click", returnWithMetaMask);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function showMessage(message, type) {
    const box = byId("appMessage");
    box.textContent = message;
    box.className = `app-message ${type || ""}`.trim();
  }

  function renderStaticConfig() {
    byId("sidebarNetwork").textContent = `${CONFIG.networkName} (${CONFIG.chainId})`;
    byId("rpcUrlText").textContent = CONFIG.rpcUrl;
    byId("chainIdText").textContent = `${CONFIG.chainId} / ${CONFIG.chainIdHex}`;
    byId("ticketPriceText").textContent = `${formatWei(CONFIG.ticketPriceWei)} SETH (${CONFIG.ticketPriceWei} wei)`;
    setAddressLink("contractAddressLink", CONFIG.contractAddress, "address");
    setAddressLink("vendorAddressLink", CONFIG.vendorAddress, "address");
  }

  function updateConfigStatus() {
    const status = byId("configStatus");
    if (isConfiguredAddress(CONFIG.contractAddress) && isConfiguredAddress(CONFIG.vendorAddress)) {
      status.textContent = "Contract configured";
      status.classList.add("ready");
      return;
    }

    status.textContent = "Add deployment details";
    status.classList.remove("ready");
    showMessage("Deploy the Solidity contract in Remix, then update js/config.js with the contract and vendor addresses.", "error");
  }

  function setAddressLink(id, address, type) {
    const link = byId(id);
    if (!isConfiguredAddress(address)) {
      link.textContent = "Not configured";
      link.removeAttribute("href");
      return;
    }

    link.textContent = address;
    link.href = `${CONFIG.explorerBaseUrl}/${type}/${address}`;
  }

  function isConfiguredAddress(address) {
    return Boolean(address) && address !== ZERO_ADDRESS && Web3.utils.isAddress(address);
  }

  function requireContractConfig() {
    if (!isConfiguredAddress(CONFIG.contractAddress)) {
      throw new Error("Contract address is missing. Deploy TicketToken.sol and update js/config.js.");
    }
  }

  function readContract() {
    requireContractConfig();
    return new readWeb3.eth.Contract(CONFIG.abi, CONFIG.contractAddress);
  }

  async function refreshContractInfo() {
    try {
      showMessage("Reading contract data from Sepolia...", "");
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
      byId("statTokenName").textContent = `${tokenName} (${tokenSymbol})`;
      byId("statTotalSupply").textContent = `${totalSupply} / max ${maxSupply}`;
      byId("statAvailableTickets").textContent = available;
      byId("statSoldTickets").textContent = sold;
      byId("ticketPriceText").textContent = `${formatWei(ticketPrice)} SETH (${ticketPrice} wei)`;
      CONFIG.ticketPriceWei = ticketPrice;

      if (!isConfiguredAddress(CONFIG.vendorAddress)) {
        CONFIG.vendorAddress = vendor;
        setAddressLink("vendorAddressLink", vendor, "address");
        updateConfigStatus();
      }

      showMessage("Contract data loaded successfully.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  function createWallet(event) {
    event.preventDefault();

    const password = byId("walletPassword").value;
    const confirm = byId("walletPasswordConfirm").value;

    if (!password) {
      showMessage("Enter a keystore password before creating a wallet.", "error");
      return;
    }

    if (password !== confirm) {
      showMessage("The keystore passwords do not match.", "error");
      return;
    }

    const localWeb3 = new Web3();
    createdWallet = localWeb3.eth.accounts.create();
    const keystore = localWeb3.eth.accounts.encrypt(createdWallet.privateKey, password);
    createdKeystoreJson = JSON.stringify(keystore, null, 2);

    byId("createdWalletAddress").value = createdWallet.address;
    byId("createdPrivateKey").value = createdWallet.privateKey;
    byId("createdPrivateKey").type = "password";
    byId("togglePrivateKeyButton").textContent = "Reveal";
    byId("createdKeystore").value = createdKeystoreJson;
    byId("downloadKeystoreButton").disabled = false;
    byId("balanceAddress").value = createdWallet.address;

    showMessage("Wallet created. Download the encrypted keystore and fund the address with Sepolia ETH before buying a ticket.", "success");
  }

  function togglePrivateKey() {
    const input = byId("createdPrivateKey");
    if (!input.value) {
      showMessage("Create a wallet before revealing a private key.", "error");
      return;
    }

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    byId("togglePrivateKeyButton").textContent = isHidden ? "Hide" : "Reveal";
  }

  function downloadCreatedKeystore() {
    if (!createdWallet || !createdKeystoreJson) {
      showMessage("Create a wallet before downloading a keystore.", "error");
      return;
    }

    const blob = new Blob([createdKeystoreJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${createdWallet.address}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function useMetaMaskForBalance() {
    try {
      const account = await ensureMetaMaskAccount();
      byId("balanceAddress").value = account;
      showMessage("MetaMask address copied into the balance checker.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  function useCreatedWalletForBalance() {
    if (!createdWallet) {
      showMessage("Create a wallet first.", "error");
      return;
    }

    byId("balanceAddress").value = createdWallet.address;
    showMessage("Created wallet address copied into the balance checker.", "success");
  }

  function useVendorForBalance() {
    if (!isConfiguredAddress(CONFIG.vendorAddress)) {
      showMessage("Add the vendor address to js/config.js first.", "error");
      return;
    }

    byId("balanceAddress").value = CONFIG.vendorAddress;
    showMessage("Configured vendor address copied into the balance checker.", "success");
  }

  async function checkBalances() {
    const address = byId("balanceAddress").value.trim();
    const actor = byId("actorType").value;

    if (!Web3.utils.isAddress(address)) {
      showMessage("Enter a valid Ethereum wallet address.", "error");
      return;
    }

    try {
      showMessage(`Checking ${actor} balances on Sepolia...`, "");
      const balanceWei = await readWeb3.eth.getBalance(address);
      byId("balanceWalletResult").textContent = shortenAddress(address);
      byId("cryptoBalanceResult").textContent = `${formatWei(balanceWei)} SETH`;

      if (!isConfiguredAddress(CONFIG.contractAddress)) {
        byId("ticketBalanceResult").textContent = "Contract not configured";
        byId("distributionResult").textContent = "Deploy first";
        showMessage("SETH balance loaded. Add the contract address to js/config.js to load ticket balances.", "success");
        return;
      }

      const contract = readContract();
      const [ticketBalance, totalSupply, available] = await Promise.all([
        contract.methods.balanceOf(address).call(),
        contract.methods.totalSupply().call(),
        contract.methods.availableTickets().call()
      ]);
      const sold = (BigInt(totalSupply) - BigInt(available)).toString();

      byId("ticketBalanceResult").textContent = `${ticketBalance} ticket${ticketBalance === "1" ? "" : "s"}`;
      byId("distributionResult").textContent = `${sold} sold, ${available} available`;
      showMessage(`${actor} balance check completed.`, "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function loadBuyKeystore() {
    try {
      buyKeystoreAccount = await decryptKeystore("buyKeystoreFile", "buyKeystorePassword");
      byId("buyLoadedAddress").value = buyKeystoreAccount.address;
      showMessage("Purchase keystore loaded. The private key stays in browser memory only.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function loadReturnKeystore() {
    try {
      returnKeystoreAccount = await decryptKeystore("returnKeystoreFile", "returnKeystorePassword");
      byId("returnLoadedAddress").value = returnKeystoreAccount.address;
      showMessage("Return keystore loaded. The private key stays in browser memory only.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function decryptKeystore(fileInputId, passwordInputId) {
    const file = byId(fileInputId).files[0];
    const password = byId(passwordInputId).value;

    if (!file) {
      throw new Error("Select a keystore JSON file.");
    }

    if (!password) {
      throw new Error("Enter the keystore password.");
    }

    const fileText = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(fileText);
    } catch (error) {
      throw new Error("The selected file is not valid JSON.");
    }

    return readWeb3.eth.accounts.decrypt(parsed, password);
  }

  async function buyWithMetaMask() {
    try {
      requireContractConfig();
      showMessage("Opening MetaMask purchase transaction...", "");
      const account = await ensureMetaMaskAccount();
      const providerWeb3 = new Web3(window.ethereum);
      const contract = new providerWeb3.eth.Contract(CONFIG.abi, CONFIG.contractAddress);
      const ticketPriceWei = await getTicketPriceWei();
      const request = {
        from: account,
        to: CONFIG.contractAddress,
        value: ticketPriceWei,
        method: "buyTicket"
      };

      const receipt = await contract.methods.buyTicket().send({
        from: account,
        value: ticketPriceWei
      });

      renderTransaction("buy", request, receipt);
      await refreshContractInfo();
      showMessage("Ticket purchase confirmed on Sepolia.", "success");
    } catch (error) {
      showMessage(normalizeProviderError(error), "error");
    }
  }

  async function buyWithKeystore() {
    try {
      requireContractConfig();
      if (!buyKeystoreAccount) {
        throw new Error("Load a purchase keystore before buying.");
      }

      showMessage("Signing and sending purchase transaction...", "");
      const contract = readContract();
      const method = contract.methods.buyTicket();
      const ticketPriceWei = await getTicketPriceWei();
      const tx = await buildSignedMethodTransaction(buyKeystoreAccount.address, method, ticketPriceWei);
      const receipt = await signAndSend(tx, buyKeystoreAccount.privateKey);

      renderTransaction("buy", tx, receipt);
      await refreshContractInfo();
      showMessage("Ticket purchase confirmed on Sepolia.", "success");
    } catch (error) {
      showMessage(normalizeProviderError(error), "error");
    }
  }

  async function returnWithMetaMask() {
    try {
      requireContractConfig();
      showMessage("Opening MetaMask return transaction...", "");
      const account = await ensureMetaMaskAccount();
      const providerWeb3 = new Web3(window.ethereum);
      const contract = new providerWeb3.eth.Contract(CONFIG.abi, CONFIG.contractAddress);
      const request = {
        from: account,
        to: CONFIG.contractAddress,
        method: "returnTicket"
      };

      const receipt = await contract.methods.returnTicket().send({ from: account });

      renderTransaction("return", request, receipt);
      await refreshContractInfo();
      showMessage("Ticket return confirmed on Sepolia.", "success");
    } catch (error) {
      showMessage(normalizeProviderError(error), "error");
    }
  }

  async function returnWithKeystore() {
    try {
      requireContractConfig();
      if (!returnKeystoreAccount) {
        throw new Error("Load a return keystore before returning a ticket.");
      }

      showMessage("Signing and sending return transaction...", "");
      const contract = readContract();
      const method = contract.methods.returnTicket();
      const tx = await buildSignedMethodTransaction(returnKeystoreAccount.address, method, "0");
      const receipt = await signAndSend(tx, returnKeystoreAccount.privateKey);

      renderTransaction("return", tx, receipt);
      await refreshContractInfo();
      showMessage("Ticket return confirmed on Sepolia.", "success");
    } catch (error) {
      showMessage(normalizeProviderError(error), "error");
    }
  }

  async function buildSignedMethodTransaction(from, method, valueWei) {
    const data = method.encodeABI();
    const base = {
      from,
      to: CONFIG.contractAddress,
      data,
      value: valueWei
    };

    let gas;
    try {
      gas = await method.estimateGas({ from, value: valueWei });
    } catch (error) {
      throw new Error(`Transaction cannot be estimated: ${normalizeProviderError(error)}`);
    }

    const gasWithBuffer = Math.ceil(Number(gas) * 1.2);
    const [gasPrice, nonce] = await Promise.all([
      readWeb3.eth.getGasPrice(),
      readWeb3.eth.getTransactionCount(from, "pending")
    ]);

    return {
      ...base,
      gas: gasWithBuffer,
      gasPrice,
      nonce,
      chainId: CONFIG.chainId
    };
  }

  async function getTicketPriceWei() {
    try {
      const price = await readContract().methods.ticketPriceWei().call();
      CONFIG.ticketPriceWei = price;
      byId("ticketPriceText").textContent = `${formatWei(price)} SETH (${price} wei)`;
      return price;
    } catch (error) {
      return CONFIG.ticketPriceWei;
    }
  }

  async function signAndSend(tx, privateKey) {
    const signed = await readWeb3.eth.accounts.signTransaction(tx, privateKey);
    return readWeb3.eth.sendSignedTransaction(signed.rawTransaction);
  }

  async function connectMetaMaskClick() {
    try {
      const account = await ensureMetaMaskAccount();
      showMessage(`MetaMask connected: ${shortenAddress(account)}`, "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function ensureMetaMaskAccount() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not available in this browser.");
    }

    await ensureSepoliaNetwork();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No MetaMask account was selected.");
    }

    return accounts[0];
  }

  async function ensureSepoliaNetwork() {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId === CONFIG.chainIdHex) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CONFIG.chainIdHex }]
      });
    } catch (switchError) {
      if (switchError.code !== 4902) {
        throw switchError;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CONFIG.chainIdHex,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: [CONFIG.rpcUrl],
          blockExplorerUrls: [CONFIG.explorerBaseUrl]
        }]
      });
    }
  }

  function renderTransaction(context, request, receipt) {
    byId(`${context}TransactionRequest`).value = JSON.stringify(request, null, 2);
    byId(`${context}TransactionResult`).value = JSON.stringify(receipt, null, 2);

    const hash = receipt.transactionHash;
    const linkContainer = byId(`${context}ExplorerLink`);
    if (hash) {
      linkContainer.innerHTML = `<a href="${CONFIG.explorerBaseUrl}/tx/${hash}" target="_blank" rel="noreferrer">View transaction on Sepolia Etherscan</a>`;
    } else {
      linkContainer.textContent = "Transaction submitted, but no hash was returned.";
    }
  }

  function formatWei(valueWei) {
    if (!valueWei && valueWei !== "0") {
      return "-";
    }

    const ether = readWeb3 ? readWeb3.utils.fromWei(valueWei.toString(), "ether") : Web3.utils.fromWei(valueWei.toString(), "ether");
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
})();

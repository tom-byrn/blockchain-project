(function () {
  "use strict";

  const app = window.TicketDapp;

  function createWallet(event) {
    event.preventDefault();

    const ui = app.ui;
    const password = ui.byId("walletPassword").value;
    const confirm = ui.byId("walletPasswordConfirm").value;

    if (!password) {
      ui.showMessage("Enter a password to encrypt the new wallet keystore.", "error");
      return;
    }

    if (password !== confirm) {
      ui.showMessage("The keystore passwords do not match. Re-enter the same password in both fields before creating the wallet.", "error");
      return;
    }

    const localWeb3 = new Web3();
    app.state.createdWallet = localWeb3.eth.accounts.create();
    const keystore = localWeb3.eth.accounts.encrypt(app.state.createdWallet.privateKey, password);
    app.state.createdKeystoreJson = JSON.stringify(keystore, null, 2);

    ui.byId("createdWalletAddress").value = app.state.createdWallet.address;
    ui.byId("createdPrivateKey").value = app.state.createdWallet.privateKey;
    ui.byId("createdPrivateKey").type = "password";
    ui.byId("togglePrivateKeyButton").textContent = "Reveal";
    ui.byId("createdKeystore").value = app.state.createdKeystoreJson;
    ui.byId("downloadKeystoreButton").disabled = false;
    ui.byId("balanceAddress").value = app.state.createdWallet.address;

    ui.showMessage("Wallet created. Download the encrypted keystore and fund the address with Sepolia ETH before buying a ticket.", "success");
  }

  function togglePrivateKey() {
    const input = app.ui.byId("createdPrivateKey");
    if (!input.value) {
      app.ui.showMessage("Create a wallet before revealing a private key.", "error");
      return;
    }

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    app.ui.byId("togglePrivateKeyButton").textContent = isHidden ? "Hide" : "Reveal";
  }

  function downloadCreatedKeystore() {
    if (!app.state.createdWallet || !app.state.createdKeystoreJson) {
      app.ui.showMessage("Create a wallet before downloading a keystore.", "error");
      return;
    }

    const blob = new Blob([app.state.createdKeystoreJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${app.state.createdWallet.address}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function decryptKeystore(fileInputId, passwordInputId) {
    const context = getKeystoreContext(fileInputId);
    const file = app.ui.byId(fileInputId).files[0];
    const password = app.ui.byId(passwordInputId).value;

    if (!file) {
      throw new Error(`Select the ${context} wallet keystore JSON file before loading it.`);
    }

    if (!password) {
      throw new Error(`Enter the password for the selected ${context} wallet keystore.`);
    }

    const fileText = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(fileText);
    } catch (error) {
      throw new Error(`The selected ${context} wallet file is not valid JSON. Choose the encrypted keystore JSON downloaded from Create Wallet.`);
    }

    try {
      return app.state.readWeb3.eth.accounts.decrypt(parsed, password);
    } catch (error) {
      throw new Error(`Could not decrypt the ${context} wallet keystore. Check that the file belongs to this wallet and that the password is correct.`);
    }
  }

  function getKeystoreContext(fileInputId) {
    return fileInputId.includes("return") ? "return" : "purchase";
  }

  app.wallet = {
    createWallet,
    togglePrivateKey,
    downloadCreatedKeystore,
    decryptKeystore
  };
})();

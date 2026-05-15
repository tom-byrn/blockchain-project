const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..", "..");

const DEFAULT_IDS = [
  "appMessage",
  "sidebarNetwork",
  "rpcUrlText",
  "chainIdText",
  "ticketPriceText",
  "contractAddressLink",
  "vendorAddressLink",
  "configStatus",
  "refreshContractButton",
  "createWalletForm",
  "downloadKeystoreButton",
  "togglePrivateKeyButton",
  "checkBalanceButton",
  "useCreatedWalletForBalanceButton",
  "checkVendorBalanceButton",
  "loadBuyKeystoreButton",
  "buyWithKeystoreButton",
  "loadReturnKeystoreButton",
  "returnWithKeystoreButton",
  "walletPassword",
  "walletPasswordConfirm",
  "createdWalletAddress",
  "createdPrivateKey",
  "createdKeystore",
  "balanceAddress",
  "statTokenName",
  "statTotalSupply",
  "statAvailableTickets",
  "statSoldTickets",
  "balanceWalletResult",
  "cryptoBalanceResult",
  "ticketBalanceResult",
  "distributionResult",
  "buyKeystoreFile",
  "buyKeystorePassword",
  "buyLoadedAddress",
  "returnKeystoreFile",
  "returnKeystorePassword",
  "returnLoadedAddress",
  "buyTransactionRequest",
  "buyTransactionResult",
  "buyExplorerLink",
  "returnTransactionRequest",
  "returnTransactionResult",
  "returnExplorerLink"
];

const DEFAULT_SCRIPTS = [
  "js/config.js",
  "js/core.js",
  "js/ui.js",
  "js/contract.js",
  "js/wallet.js",
  "js/balances.js",
  "js/transactions.js",
  "js/app.js"
];

const DEFAULT_ACCOUNT = {
  address: "0x0000000000000000000000000000000000000001",
  privateKey: "0xprivatekey"
};

function createTestApp(options = {}) {
  const calls = {
    contractConstructed: [],
    contractCalls: [],
    estimateGas: [],
    gasPriceRequests: 0,
    transactionCountRequests: [],
    signedTransactions: [],
    sentTransactions: [],
    createdObjectUrls: [],
    revokedObjectUrls: []
  };
  const elements = new Map(DEFAULT_IDS.map((id) => [id, createElement(id)]));
  const tabs = createTabs(elements);
  const panels = createPanels(elements);
  const documentListeners = {};
  const document = createDocument(elements, tabs, panels, documentListeners);
  const Web3 = createWeb3(options, calls);
  const sandbox = {
    Blob: MockBlob,
    URL: {
      createObjectURL(blob) {
        calls.createdObjectUrls.push(blob);
        return "blob:mock";
      },
      revokeObjectURL(url) {
        calls.revokedObjectUrls.push(url);
      }
    },
    Web3,
    console,
    document,
    window: { Web3 }
  };
  const context = vm.createContext(sandbox);

  for (const script of options.scripts || DEFAULT_SCRIPTS) {
    vm.runInContext(readProjectFile(script), context, { filename: script });
  }

  async function triggerDOMContentLoaded() {
    for (const handler of documentListeners.DOMContentLoaded || []) {
      await handler();
    }
  }

  return {
    app: sandbox.window.TicketDapp,
    calls,
    context,
    document,
    elements,
    getById: (id) => document.getElementById(id),
    panels,
    sandbox,
    tabs,
    triggerDOMContentLoaded
  };
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function createClassList(initial = []) {
  const classes = new Set(initial);

  return {
    add(name) {
      classes.add(name);
    },
    remove(name) {
      classes.delete(name);
    },
    contains(name) {
      return classes.has(name);
    },
    toString() {
      return Array.from(classes).join(" ");
    }
  };
}

function createElement(id, classNames = []) {
  const listeners = {};
  const element = {
    attributes: {},
    children: [],
    id,
    dataset: {},
    value: "",
    textContent: "",
    innerHTML: "",
    className: classNames.join(" "),
    classList: createClassList(classNames),
    disabled: false,
    type: "text",
    files: [],
    href: "",
    download: "",
    appendChild(child) {
      this.children.push(child);
      refreshTextContent(this);
      return child;
    },
    replaceChildren(...children) {
      this.children = [];
      this.textContent = "";
      this.innerHTML = "";

      for (const child of children) {
        this.appendChild(child);
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getAttribute(name) {
      return this.attributes[name] || null;
    },
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    async click() {
      for (const handler of listeners.click || []) {
        await handler({ preventDefault() {} });
      }
    },
    async submit() {
      for (const handler of listeners.submit || []) {
        await handler({ preventDefault() {} });
      }
    },
    remove() {},
    removeAttribute(name) {
      delete this[name];
      delete this.attributes[name];
    }
  };

  return element;
}

function refreshTextContent(element) {
  element.textContent = element.children.map((child) => child.textContent).join("");
}

function createTabs(elements) {
  return ["contractInfo", "createWallet", "checkBalances", "buyTicket", "returnTicket"].map((id, index) => {
    const tab = createElement(`${id}Tab`, index === 0 ? ["tab-button", "active"] : ["tab-button"]);
    tab.dataset.tab = id;
    elements.set(tab.id, tab);
    return tab;
  });
}

function createPanels(elements) {
  return ["contractInfo", "createWallet", "checkBalances", "buyTicket", "returnTicket"].map((id, index) => {
    const panel = createElement(id, index === 0 ? ["tab-panel", "active"] : ["tab-panel"]);
    elements.set(id, panel);
    return panel;
  });
}

function createDocument(elements, tabs, panels, documentListeners) {
  return {
    body: {
      children: [],
      appendChild(element) {
        this.children.push(element);
      }
    },
    addEventListener(type, handler) {
      documentListeners[type] = documentListeners[type] || [];
      documentListeners[type].push(handler);
    },
    createElement(tag) {
      return createElement(tag);
    },
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement(id));
      }
      return elements.get(id);
    },
    querySelectorAll(selector) {
      if (selector === ".tab-button") {
        return tabs;
      }
      if (selector === ".tab-panel") {
        return panels;
      }
      return [];
    }
  };
}

function createWeb3(options, calls) {
  const createdAccount = options.createdAccount || DEFAULT_ACCOUNT;
  const decryptedAccount = options.decryptedAccount || DEFAULT_ACCOUNT;
  const contract = options.contract || createMockContract(options, calls);

  function Web3(rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.utils = Web3.utils;
    this.eth = {
      accounts: {
        create() {
          return { ...createdAccount };
        },
        encrypt(privateKey, password) {
          return {
            address: createdAccount.address.slice(2).toLowerCase(),
            crypto: { cipher: "mock" },
            passwordHint: password,
            privateKey
          };
        },
        decrypt(keystore, password) {
          if (options.decryptError) {
            throw options.decryptError;
          }
          calls.decryptedKeystore = { keystore, password };
          return { ...decryptedAccount };
        },
        async signTransaction(tx, privateKey) {
          calls.signedTransactions.push({ tx, privateKey });
          return { rawTransaction: options.rawTransaction || "0xsigned" };
        }
      },
      Contract: function Contract(abi, address) {
        calls.contractConstructed.push({ abi, address });
        return contract;
      },
      async getBalance(address) {
        calls.getBalanceAddress = address;
        if (options.balanceError) {
          throw options.balanceError;
        }
        return options.balanceWei || "0";
      },
      async getGasPrice() {
        calls.gasPriceRequests += 1;
        return options.gasPrice || "10";
      },
      async getTransactionCount(address, blockTag) {
        calls.transactionCountRequests.push({ address, blockTag });
        calls.getTransactionCount = { address, blockTag };
        return options.nonce || 0;
      },
      async sendSignedTransaction(rawTransaction) {
        calls.sentTransactions.push(rawTransaction);
        return options.receipt || { transactionHash: "0xhash" };
      }
    };
  }

  Web3.utils = {
    isAddress(address) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    },
    fromWei(value) {
      const wei = BigInt(value);
      const ether = wei / 1000000000000000000n;
      const remainder = wei % 1000000000000000000n;

      if (remainder === 0n) {
        return ether.toString();
      }

      const fraction = remainder.toString().padStart(18, "0").replace(/0+$/, "");
      return `${ether}.${fraction}`;
    }
  };

  return Web3;
}

function createMockContract(options, calls) {
  const values = {
    available: "98",
    maxSupply: "100",
    name: "Campus Event Ticket",
    symbol: "TICKET",
    ticketBalance: "2",
    ticketPriceWei: "10000000000000",
    totalSupply: "100",
    vendor: "0x1a18F2F851BAfDA9e11eA5cC82893F2729a11cC3",
    ...options.contractValues
  };

  return {
    methods: {
      name: () => callMethod(calls, "name", values.name),
      symbol: () => callMethod(calls, "symbol", values.symbol),
      totalSupply: () => callMethod(calls, "totalSupply", values.totalSupply),
      maxSupply: () => callMethod(calls, "maxSupply", values.maxSupply),
      availableTickets: () => callMethod(calls, "availableTickets", values.available),
      ticketPriceWei: () => callMethod(calls, "ticketPriceWei", values.ticketPriceWei, options.ticketPriceError),
      vendor: () => callMethod(calls, "vendor", values.vendor),
      balanceOf: (address) => {
        calls.balanceOfAddress = address;
        return callMethod(calls, "balanceOf", values.ticketBalance);
      },
      buyTicket: () => txMethod("buyTicket", "0xbuy", options.buyGas || "50000", calls),
      returnTicket: () => txMethod("returnTicket", "0xreturn", options.returnGas || "45000", calls)
    }
  };
}

function callMethod(calls, name, value, error) {
  return {
    async call() {
      calls.contractCalls.push(name);
      if (error) {
        throw error;
      }
      return value;
    }
  };
}

function txMethod(name, encodedData, gas, calls) {
  return {
    encodeABI() {
      return encodedData;
    },
    async estimateGas(args) {
      calls.estimateGas.push({ name, args });
      if (gas instanceof Error) {
        throw gas;
      }
      return gas;
    }
  };
}

function MockBlob(parts, options) {
  this.parts = parts;
  this.options = options;
}

module.exports = {
  createTestApp,
  readProjectFile
};

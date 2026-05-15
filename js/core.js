(function () {
  "use strict";

  window.TicketDapp = window.TicketDapp || {};

  window.TicketDapp.config = window.TICKET_DAPP_CONFIG;
  window.TicketDapp.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  window.TicketDapp.state = {
    readWeb3: null,
    createdWallet: null,
    createdKeystoreJson: "",
    contractInfoCache: null,
    buyKeystoreAccount: null,
    returnKeystoreAccount: null
  };
})();

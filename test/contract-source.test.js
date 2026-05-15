const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const contractPath = path.resolve(__dirname, "..", "contracts", "TicketToken.sol");
const source = fs.readFileSync(contractPath, "utf8");

test("constructor validates deployment values and mints all tickets to the venue", () => {
  const constructorBody = getBlockAfter("constructor(");

  assertContains(constructorBody, 'require(bytes(_name).length > 0, "Name is required");');
  assertContains(constructorBody, 'require(bytes(_symbol).length > 0, "Symbol is required");');
  assertContains(constructorBody, 'require(_vendor != address(0), "Vendor is required");');
  assertContains(constructorBody, 'require(_ticketPriceWei > 0, "Ticket price is required");');
  assertContains(constructorBody, 'require(_maxSupply > 0, "Max supply is required");');

  assertContainsInOrder(
    constructorBody,
    "vendor = _vendor;",
    "ticketPriceWei = _ticketPriceWei;",
    "maxSupply = _maxSupply;",
    "totalSupply = _maxSupply;",
    "balances[_vendor] = _maxSupply;",
    "emit Transfer(address(0), _vendor, _maxSupply);"
  );
});

test("buyTicket requires exact payment, available venue inventory, and forwards funds", () => {
  const body = getFunctionBody("buyTicket");

  assertContainsInOrder(
    body,
    'require(msg.value == ticketPriceWei, "Incorrect ticket price");',
    'require(balances[vendor] >= 1, "No tickets available");',
    "_transfer(vendor, msg.sender, 1);",
    "(bool sent, ) = vendor.call{value: msg.value}(\"\");",
    'require(sent, "Vendor payment failed");',
    "emit TicketPurchased(msg.sender, msg.value);"
  );
});

test("returnTicket rejects venue self-returns and transfers one ticket back to the venue", () => {
  const body = getFunctionBody("returnTicket");

  assertContainsInOrder(
    body,
    'require(msg.sender != vendor, "Vendor cannot return tickets");',
    "_transfer(msg.sender, vendor, 1);",
    "emit TicketReturned(msg.sender);"
  );
  assert.equal(body.includes("call{value:"), false, "returns should not send refunds or other payments");
});

test("transferFrom spends allowance before moving tickets", () => {
  const body = getFunctionBody("transferFrom");

  assertContainsInOrder(
    body,
    "uint256 currentAllowance = allowances[sender][msg.sender];",
    'require(currentAllowance >= amount, "Transfer exceeds allowance");',
    "_approve(sender, msg.sender, currentAllowance - amount);",
    "_transfer(sender, recipient, amount);",
    "return true;"
  );
});

function getFunctionBody(name) {
  return getBlockAfter(`function ${name}`);
}

function getBlockAfter(marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} should exist`);

  const openBraceIndex = source.indexOf("{", markerIndex);
  assert.notEqual(openBraceIndex, -1, `${marker} should have a body`);

  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    }

    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex + 1, index);
      }
    }
  }

  throw new Error(`${marker} body was not closed`);
}

function assertContains(text, snippet) {
  assert.ok(text.includes(snippet), `Expected contract source to include: ${snippet}`);
}

function assertContainsInOrder(text, ...snippets) {
  let previousIndex = -1;

  for (const snippet of snippets) {
    const index = text.indexOf(snippet);
    assert.notEqual(index, -1, `Expected contract source to include: ${snippet}`);
    assert.ok(index > previousIndex, `Expected "${snippet}" to appear after the previous checked statement`);
    previousIndex = index;
  }
}

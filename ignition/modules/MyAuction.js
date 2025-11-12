// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const {Brand , SerialNumber} = require('../../product.json');
const Duration = 5; // 5 minutes

module.exports = buildModule("MyAuctionModule", (m) => {

  // มากจาก parametor constructor ของ MyAuction.sol
  const brand = m.getParameter("_name", Brand);
  const sn = m.getParameter("_sn", SerialNumber);
  const duration = m.getParameter("durationMinute", Duration);
  const myAuction = m.contract("MyAuction", [brand , sn , duration]);
  return { myAuction };
});

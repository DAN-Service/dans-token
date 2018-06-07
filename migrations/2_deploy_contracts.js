var ADXToken = artifacts.require("./DANSToken.sol");

module.exports = function(deployer) {
  var startDate = Math.floor(Date.now()/1000);

  deployer.deploy(ADXToken, 
  	web3.eth.accounts[0], // multisig
  	web3.eth.accounts[9], // team, whre 4% bounty will be received
  	startDate+7*24*60*60, // public sale start
	startDate, // private sale start
  	30800*1000000000000000000, // ETH hard cap, in wei
  	web3.eth.accounts[1], 5047335,
  	web3.eth.accounts[2], 2053387,
  	web3.eth.accounts[3], 2340000
  );
};

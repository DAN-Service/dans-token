var DANSToken = artifacts.require("./DANSToken.sol");
var Promise = require('bluebird')
var time = require('../helpers/time')


contract('DANSToken', function(accounts) {

  var crowdsale;

  var EXPECT_FOR_ONE_ETH = 11700000;

  var ownerAddr = web3.eth.accounts[1];
  var danTeamAddr = web3.eth.accounts[9];
  var danFundAddr = web3.eth.accounts[8];
  var prebuyAddr = web3.eth.accounts[1]; // one of the pre-buy addresses


  var participiants = web3.eth.accounts.slice(3, 8).map(account => {
    return {
      account: account,
      sent: web3.toWei(1, 'ether')
    }
  })

  var blockchainDate = function() {
    return web3.eth.getBlock(web3.eth.blockNumber).timestamp
  }

  var newSC = function(startDate) {
    return DANSToken.new(
      ownerAddr, // multisig
      danTeamAddr, // team, whre 4% bounty will be received
      startDate, // public sale start
      startDate-7*24*60*60, // private sale start
      web3.toWei(4, 'ether'), // ETH hard cap, in wei
      web3.eth.accounts[1], 5047335,
      web3.eth.accounts[2], 5047335, // TODO: change accordingly
      web3.eth.accounts[3], 2340000 
    )
  }

  it("initialize contract", function() {
    return newSC(blockchainDate()).then(function() { // ugly hack to get latest block (+timestamp) updated :( )
      var startDate = blockchainDate()
      return newSC(startDate)
    })
    .then(function(_crowdsale) {
      crowdsale = _crowdsale
    })
  });

  it("should start with 0 eth", function() {
    return crowdsale.etherRaised.call()
    .then(function(eth) {
      assert.equal(eth.valueOf(), 0);
    })
  });

  it('Should allow to send ETH in exchange of Tokens', () => {
    const currentParticipiants = participiants.slice(0, 3)

    return Promise.all(currentParticipiants.map(participiant => {
      return new Promise((resolve, reject) => {
        web3.eth.sendTransaction({
          from: participiant.account,
          to: crowdsale.address,
          value: participiant.sent,
          gas: 130000
        }, (err) => {
          if (err) reject(err) 
          
          crowdsale.balanceOf(participiant.account).then(function(res) {
            assert.equal(res.valueOf(), EXPECT_FOR_ONE_ETH);
            resolve()
          }).catch(reject)

        })
      })
    }))
  })

  it('Shouldnt allow to transfer tokens before end of crowdsale', () => {
    return crowdsale.transfer(web3.eth.accounts[4], 50, {
      from: web3.eth.accounts[5]
    }).then(() => {
      throw new Error('Cant be here')
    }).catch(err => {
      assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
    }).then(() => {
      return Promise.join(
        crowdsale.balanceOf.call(web3.eth.accounts[4]),
        crowdsale.balanceOf.call(web3.eth.accounts[5]),
        (toBalance, fromBalance) => {
            assert.equal(toBalance.valueOf(), EXPECT_FOR_ONE_ETH)
            assert.equal(fromBalance.valueOf(), EXPECT_FOR_ONE_ETH)

        }
      )
    })
  })

  it('Reach the hard cap', () => {
    const one = participiants[3]
    const two = participiants[4]

    return new Promise((resolve, reject) => {
      web3.eth.sendTransaction({
        from: one.account,
        to: crowdsale.address,
        value: one.sent,
        gas: 130000
      }, (err) => {
        if (err) reject(err) 
        
        // allow first one to participate, therefore reaching the HC
        web3.eth.sendTransaction({
          from: two.account,
          to: crowdsale.address,
          value: two.sent,
          gas: 130000
        }, (err) => {
          if (!err) throw new Error('should not allow second to participate, hard cap should be reached')
          resolve()
        })
      })
    })
  })

  // tokens transferable after end of crowdsale
  it('Should allow to transfer tokens after end of crowdsale', () => {
    return crowdsale.transfer(web3.eth.accounts[4], 50, {
      from: web3.eth.accounts[5]
    }).then(() => {
       return Promise.join(
        crowdsale.balanceOf.call(web3.eth.accounts[4]),
        crowdsale.balanceOf.call(web3.eth.accounts[5]),
        (toBalance, fromBalance) => {
            assert.equal(toBalance.valueOf(), EXPECT_FOR_ONE_ETH+50)
            assert.equal(fromBalance.valueOf(), EXPECT_FOR_ONE_ETH-50)
        }
      )
    })
  })

});

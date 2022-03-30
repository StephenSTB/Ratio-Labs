

const MyGovernor = artifacts.require("MyGovernor");

const MyToken = artifacts.require("MyToken");

const MockGovernor = artifacts.require("MockGovernor");

const TimelockController = artifacts.require("TimelockController.sol");

const BlockMiner = artifacts.require("BlockMiner.sol");

describe("MockGovernor contract manipulation.", function(){
    let accounts;
    let utils;
    

    var myToken;
    var timelockController;

    var myGov;

    var miner;
    
    before(async function () {
        accounts = await web3.eth.getAccounts();
        utils = await web3.utils;
        
      });

    it("Deploying MyToken, TimelockController MyGovernor ", async function(){

        myToken = await MyToken.new();

        console.log(`Account0: ${accounts[0]}`)

        var accountBalance = await myToken.balanceOf(accounts[0]);

        console.log(`Account0 balance : ${accountBalance}`)
        
        /*
        timelockController = await TimelockController.new(1, [accounts[0]], [accounts[0]]);

        console.log(`   ${myToken.contract.methods.transfer(accounts[0],1).encodeABI()}`);*/

        myGov = await MockGovernor.new(myToken.address);

        await myToken.transfer(myGov.address, utils.toWei(".1", `ether`));

        var govBalance = await myToken.balanceOf(myGov.address);
        
        console.log(`gov balance: ${govBalance}`);

        var proposal = myToken.contract.methods.transfer(accounts[1],utils.toWei(".1", `ether`)).encodeABI()

        console.log(`   ${proposal}`);

        myGov.propose(myToken.address, 0, proposal, "Proposal #1: Give grant to team");

        // delegate votes to self

        // cast vote in favor of proposal

        // execute proposal

        /*
        describe("Governor deployment test", async () =>{
            it("Verifies vote delay.", async () =>{
                console.log(myGov.votingDelay().call());
                assert.equal(myGov.votingDelay().call(), 6575);
            });
        });*/
        /*
        miner = await BlockMiner.new();

        console.log(`   block ${await web3.eth.getBlockNumber()}`)

        await miner.mine();

        console.log(`   block ${await web3.eth.getBlockNumber()}`)

        //var transferCalldata = await myToken.methods.transfer(accounts[0], 1).encodeABI();

        //console.log(transferCalldata)*/

    });
});
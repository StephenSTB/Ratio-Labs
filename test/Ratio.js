const Ratio = artifacts.require("Ratio");

const Goverened = artifacts.require("Governed");

// Vanilla Mocha test. Increased compatibility with tools that integrate Mocha.
describe("Ratio contract", function () {
    let accounts;
    let utils;      
    var ratio;
    var governed;
    before(async function () {
      accounts = await web3.eth.getAccounts();
      utils = await web3.utils;
      
    });
  
   
    it("Should deploy ratio contract with correct variables.", async function () {
      ratio = await Ratio.new([utils.toWei("100000", "ether"),utils.toWei("350000", "ether"),utils.toWei("1000000", "ether")],
      [15, 35, 50], [15, 35, 50]);

      assert.equal(await ratio.epoch(), 0)
      assert.equal(await ratio.epochDuration(), 1_000_000_000)

      //console.log(`   ${ratio.address}`)
      
      /*
      instance.setValue(5).then(function(result) {
        // result object contains import information about the transaction
        console.log("Value was set to", result.logs[0].args.val);
      });
      */
    });

    it("Should deploy governed contract with correct variables", async () =>{

      governed = await Goverened.new(ratio.address, "Mock Governed Contract", utils.toWei("100000", "ether"), 1000000);

    });

    it("Should correctly submit an approve proposal for the governed contract", async () =>{
      
      var proposalAddress = await ratio.approveProposal("Governed Contract Proposal", "This is a Governed Contract that should be approved.", [governed.address], {value: utils.toWei(".1", "ether")})
      .then((result) =>{
          console.log(result.logs[0].args._proposal)
          return result.logs[0].args._proposal;
      })

    });
   
});
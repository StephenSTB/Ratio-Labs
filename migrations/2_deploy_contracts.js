
var Web3 = require("web3")

const fs = require('fs')

const WMatic = artifacts.require("./WMatic");
 
const PolyCard = artifacts.require("./PolyCard");

const utils = web3.utils;

var contracts = {}

//0xCA76A94C54b461d7230a59f4f78C1Dd3a0eACd63

 module.exports = async function(deployer){
   //var wMatic = await deployer.deploy(WMatic, utils.toWei("10000", "ether"));
   //contracts["wMatic"] = wMatic.address;

   //console.log(wMatic)

   /*
   fs.writeFileSync("./Contracts.json", JSON.stringify(contracts, null, 4), (err) =>{
      if(err){
         console.log(err)
         return
      }
   })*/


 }
var providers = require("../src/data/Providers.json");

var networkData = require("../src/data/Network_Data.json");

const fs = require("fs");

var os = require('os');

var networkInterfaces = os.networkInterfaces();

init = () =>{
    console.log("initializing ip data");
    var ip = networkInterfaces.eth0[0].address;

    console.log(`wsl ip address: ${ip}`)

    providers.Ganache.url = "ws://" + ip + ":8545";

    console.log(`Ganache url: ${providers.Ganache.url}`)

    fs.writeFileSync("./src/data/Providers.json", JSON.stringify(providers, null, 4), (err) =>{
        if(err) 
            console.log(err)
    })

    networkData[1337].rpcUrls[0] = "http://" + ip + ":8545";

    console.log(`Ganache network data url: ${networkData[1337].rpcUrls[0]}`);

    fs.writeFileSync("./src/data/Network_Data.json", JSON.stringify(networkData, null, 4))
}

init();
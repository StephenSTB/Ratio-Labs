const IPFS = require("ipfs");

const fs = require("fs");

const all = require("it-all");

const toBuffer = require('it-to-buffer')

async function main(){
    const ipfs = await IPFS.create();
    const version = await ipfs.version();

    console.log("Version:", version.version);

    /*
    var results = await ipfs.add("hello random");

    console.log(results.cid.toString())

    var stream = ipfs.cat(results.cid.toString())

    var data = ''

    for await(const chunk of stream){
        data += chunk.toString()
    }

    console.log(data)*/

    var ratioCardPath = "./images/RatioCard/Ratio_Card_Base.png"
    

    var basePath = "./images/PolygonCards/Card/Complete/";

    //console.log(`Ten common path: ${basePath + "Ten/Common/PolyCard-Ten-Common.gif"}`);

    var cardFiles = [ 
                      {path: "Ratio_Card_Base.png", content: fs.readFileSync(ratioCardPath)},
                      // Ten Cards
                      { path: "PolyCard_Ten_Common.gif", content: fs.readFileSync((basePath + "Ten/Common/PolyCard_Ten_Common.gif")) },
                      { path: "PolyCard_Ten_Unique.gif", content: fs.readFileSync((basePath + "Ten/Unique/PolyCard_Ten_Unique.gif")) },
                      { path: "PolyCard_Ten_Rare.gif", content: fs.readFileSync((basePath + "Ten/Rare/PolyCard_Ten_Rare.gif")) },
                      { path: "PolyCard_Ten_Mythic.gif", content: fs.readFileSync((basePath + "Ten/Mythic/PolyCard_Ten_Mythic.gif")) },
                      { path: "PolyCard_Ten_Ledgendary.gif", content: fs.readFileSync((basePath + "Ten/Ledgendary/PolyCard_Ten_Ledgendary.gif")) },
                      // OneHundred Cards
                      { path: "PolyCard_OneHundred_Common.gif", content: fs.readFileSync((basePath + "OneHundred/Common/PolyCard_OneHundred_Common.gif")) },
                      { path: "PolyCard_OneHundred_Unique.gif", content: fs.readFileSync((basePath + "OneHundred/Unique/PolyCard_OneHundred_Unique.gif")) },
                      { path: "PolyCard_OneHundred_Rare.gif", content: fs.readFileSync((basePath + "OneHundred/Rare/PolyCard_OneHundred_Rare.gif")) },
                      { path: "PolyCard_OneHundred_Mythic.gif", content: fs.readFileSync((basePath + "OneHundred/Mythic/PolyCard_OneHundred_Mythic.gif")) },
                      { path: "PolyCard_OneHundred_Ledgendary.gif", content: fs.readFileSync((basePath + "OneHundred/Ledgendary/PolyCard_OneHundred_Ledgendary.gif")) },
                      // OneThousand Cards
                      { path: "PolyCard_OneThousand_Common.gif", content: fs.readFileSync((basePath + "OneThousand/Common/PolyCard_OneThousand_Common.gif")) },
                      { path: "PolyCard_OneThousand_Unique.gif", content: fs.readFileSync((basePath + "OneThousand/Unique/PolyCard_OneThousand_Unique.gif")) },
                      { path: "PolyCard_OneThousand_Rare.gif", content: fs.readFileSync((basePath + "OneThousand/Rare/PolyCard_OneThousand_Rare.gif")) },
                      { path: "PolyCard_OneThousand_Mythic.gif", content: fs.readFileSync((basePath + "OneThousand/Mythic/PolyCard_OneThousand_Mythic.gif")) },
                      { path: "PolyCard_OneThousand_Ledgendary.gif", content: fs.readFileSync((basePath + "OneThousand/Ledgendary/PolyCard_OneThousand_Ledgendary.gif")) }
                    ]

    var nft_cid = JSON.parse(fs.readFileSync("./src/data/NFT_CID.json"));
    //console.log(nft_cid);

    for await (const result of ipfs.addAll(cardFiles)){
        //console.log(`path: ${result.path}, cid: ${result.cid.toString()}`);
        //console.log(result);
        nft_cid[result.path] = result.cid.toString();
    }

    fs.writeFileSync("./src/data/NFT_CID.json", JSON.stringify(nft_cid, null, 4), (err) =>{
        if(err){
            console.log(err);
            return;
        }
        console.log(nft_cid)
    })

    console.log(nft_cid)

    while(true){

        const peerInfos = await ipfs.swarm.peers()
        console.log(peerInfos.length)
        await new Promise(r => setTimeout(r, 120000));
    }

    /*
    try{
        //await ipfs.files.rm("/PolygonCards", {recursive: true});
        //await ipfs.files.rm("QmchXiEpUtrbBytyB8jwwPwNx7SgKuDGhuso6TDZUzE3ss")
        await ipfs.files.rm("QmeZKMuW65SniEtQXrX5quck4ndkrMMvNAKo4bJUXThbJJ")
        await ipfs.files.rm("Qmci4x92WCPfTM6ux53gDBzWU2nqcDg8Q9zt5E5SbvfW6G")
    }catch(err){
        console.log("Invalid initial remove", err);
    }*/

    /*
    var fileAdded = await ipfs.add(tenCardFiles[0])

    console.log(fileAdded)

    //await ipfs.files.mkdir("/PolygonCards/Ten", {parents:true})

    //await ipfs.files.write("/" + tenCardFiles[0].path, tenCardFiles[0].content, {create:true} )

    var res = await all(ipfs.files.ls("/"))

    console.log(`All files: `);

    console.log(res);

    /*
    const RatioCard = fs.readFileSync("./images/RatioCard/RatioCardBase.png");

    var file = {
        path: `/RatioCardBase.png`,
        content: RatioCard
    }

    var fileAdded = await ipfs.add(file);

    console.log(fileAdded);

    console.log(`${fileAdded.path}: ${fileAdded.cid}`)

    const TenCommon = fs.readFileSync("./images/PolygonCards/Card/Complete/Ten/Common/PolyCard-Ten-Common.gif");

    file = {
        path: "/PolyCard-Ten-Common.gif",
        content: TenCommon
    }

    fileAdded = await ipfs.add(file);

    console.log(fileAdded);

    console.log(`${fileAdded.path}: ${fileAdded.cid}`)

    /*
    
    console.log(`pixelCrownLegend.png: ${fileAdded.cid}`)

    var stat = await ipfs.files.stat("/");
    console.log(`ipfs root directory stat:`);

    console.log(stat);
    /*

    await ipfs.files.mkdir("/PolygonCards/Ten", {parents:true});
    
    const TenCommon = fs.readFileSync("./images/PolygonCards/Card/Complete/Ten/Common/PolyCard-Ten-Common.gif");

    await ipfs.files.write("/PolygonCards/Ten/" + "PolyCardTenCommon.gif", TenCommon, {create:true});

    var stat = await ipfs.files.stat("/");
    console.log(`ipfs root directory stat:`);

    console.log(stat);

    var result = await all(ipfs.files.ls("/PolygonCards/Ten"));

    console.log(result);

    /*
    //clean dir

    await ipfs.files.rm("/PolygonCards", {recursive: true});

    var stat = await ipfs.files.stat("/");
    console.log(`initial ipfs root directory stat:`);

    console.log(stat);

    //console.log(`cid: ${stat.cid.toString()}`);

    const RatioCard = fs.readFileSync("./images/RatioCard/RatioCardBase.png");

    await ipfs.files.write("/" + "RatioCardBase.png", RatioCard, {create:true});

    const cardDir = "./images/PolygonCards/Card/Complete"

    const cardDirTen = cardDir + "/Ten";

    console.log(cardDirTen + "/Common/PolyCard-Ten-Common.gif")

    const tenCommon = fs.readFileSync((cardDirTen + "/Common/PolyCard-Ten-Common.gif"));

    await ipfs.files.mkdir("/PolygonCards/Ten", {parents:true});

    await ipfs.files.write("/PolygonCards/Ten" + "PolyCard-Ten-Common.gif", tenCommon, {create: true});

    stat = await ipfs.files.stat("/PolygonCards/Ten");

    console.log("ten stat:")

    console.log(stat);

    console.log("Cards cards:")

    var res = await all(ipfs.files.ls("/PolygonCards"))

    console.log(res);

    stat = await ipfs.files.stat("/");
    console.log(stat)

    //stat = await ipfs.files.stat("/");

    //console.log(`stat after adding file:`);

    //console.log(stat)

    
    
    /*

    console.log("Adding Ratio Card")    

    //console.log(imgdata.toStrinb());

    const fileAdded = await ipfs.add({
        path: 'RatioCardBase.png',
        content: RatioCard
    },{ wrapWithDirectory: true });
    
    console.log(`RatioCard: ${fileAdded.cid}`)

    /*
    await ipfs.files.mkdir('/images')

    await ipfs.files.write(
        '/images/yourfile.jpg',
        imgdata,
        {create: true})*/
    
    //process.exit(1);
}

main();
var host;
module.exports = class nftGatewayAPI{

    constructor(h){
        host = h;
    }

    test = () =>{
        return true;
    }

    state = async(contract) =>{
        try{
            const resp = await fetch(host + "/state?contract=" + contract, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                
            });
            /*
            console.log("res:");
            console.log(await resp.json())*/
            return await resp.json();
        }
        catch{}
    
        return null;
    }

    leaves = async(cid) =>{
        try{
            const resp = await fetch(host + "/leaves?cid=" + cid, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                
            });
            /*
            console.log("res:");
            console.log(await resp.json())*/
            return await resp.json();
        }
        catch{}
    
        return null;
    }


    verify = async(data) =>{
        try{
            const resp = await fetch(host + "/verify", {
                method: 'POST',
                body: data
            });
            //console.log(await resp.json())
            return await resp.json();
        }catch{}

    }
}

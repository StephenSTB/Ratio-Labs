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
    
    verify = async(nft) =>{
        try{
            const resp = await fetch(host + "/verify", {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(nft)
            });
        
            //console.log(await resp.json());
            return await resp.json();
        }
        catch{}
        
        return null;
    }


    host = async(data) =>{
        try{
            const resp = await fetch(host + "/host", {
                method: 'POST',
                body: data
            });
            //console.log(await resp.json())
            return await resp.json();
        }catch{}

    }
}

const axios = require('axios')

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
            const resp = axios({
                url: host + "/state?contract=" + contract,
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                
            }).then((res) =>{
                return res;
            }).catch((err) => {
                //console.log(err)
                return err;
            })
            /*
            console.log("res:");
            console.log(await resp.json())*/
            return resp;
        }
        catch{}
    
        return null;
    }
    
    verify = async(nft) =>{
        try{
            const resp = axios({
                url: host + "/verify",
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                data: JSON.stringify(nft)
            }).then((res) =>{
                return res;
            }).catch((err) => {
                //console.log(err)
                return err;
            })

            //console.log(await resp.json());
            return resp;
        }
        catch{}
        
        return null;
    }


    host = async(data) =>{
        try{
            const formHeaders = data.getHeaders();
            const resp = axios({
                url: host + "/host",
                method: 'POST',
                headers:{
                    ...formHeaders,
                },
                data: data
            }).then((res) =>{
                return res;
            }).catch((err) => {
                //console.log(err)
                return err;
            })
            //console.log(await resp.json())
            return resp;
        }catch{}

    }
}

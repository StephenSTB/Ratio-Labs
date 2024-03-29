const axios = require('axios');
const async = require('mime-kind');

var host;
module.exports = class nftGatewayAPI{

    constructor(h){
        host = h;
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

    leaves = async(cid) =>{
        try{
            const resp = axios({
                url: host + "/leaves?cid=" + cid,
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
    
    verify = async(data) =>{
        try{
            const formHeaders = data.getHeaders();
            const resp = axios({
                url: host + "/verify",
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

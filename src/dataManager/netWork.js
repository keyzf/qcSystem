import { Promise } from "q";
import { copyFileSync } from "fs";

class NetWork {
    constructor(){
        this.fetch_url = 'http://localhost:8000/'
        this.require('test').then(res => console.log(res))
        // this.
    }
    url2data = {}
    require(url, par = undefined){
        let url2data = this.url2data
        // console.log(url2data)
        url = this.fetch_url + url
        if (par) {
            url += '?'
            for(let key in par){
                let elm = par[key]
                if(Array.isArray(elm))
                    elm = elm.join(',')
                url += key + '=' + elm + '&'
            }
            url = url.slice(0,-1)            
        }

        if (false) {
            return new Promise(()=>{
                console.log('已获得' , url, url2data[url])
                return url2data[url]
            })
        }else{
            console.log('get', url.slice(0, 100))
            // 已经加个获得过url的data可以直接存着
            return fetch(url,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json;charset=UTF-8'
                },
                cache:'default'
            })
            .then(res =>{
                let data = res.json() 
                this.url2data[url] = data
                return data
            })            
        }

    }

}

var net_work = new NetWork()
export default net_work
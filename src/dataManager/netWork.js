// import { Promise } from "q";
import deepcopy from 'deepcopy'

class NetWork {
    constructor(){
        this.fetch_url = 'http://10.188.186.21:8000/'//'http://localhost:8000/' //'http://10.180.151.233:8000/' //'http://localhost:8000/'//'http://songciserver.vps.lppy.site:6060/' //
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

        if (url2data[url]) {
            return new Promise(()=>{
                console.log('已获得' , url, url2data[url])
                return url2data[url]
            }).then(res=> {
                console.log(res)
                return res
            })
        }else{
            console.log('get', url.slice(0, 50))
            // 已经加个获得过url的data可以直接存着
            return fetch(url,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json;charset=UTF-8'
                },
                cache:'default'
            })
            .then(res =>{
                // console.log(res)
                let data = res.json()
                // this.url2data[url] = deepcopy(data)  //现在有问题
                // console.log(data)
                return data
            })            
        }

    }

}

var net_work = new NetWork()
export default net_work
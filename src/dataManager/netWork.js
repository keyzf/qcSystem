
class NetWork {
    constructor(){
        this.fetch_url = 'http://localhost:8000/'
        this.require('test').then(res => console.log(res))
    }

    require(url, par = undefined){
        url = this.fetch_url + url
        if (par) {
            url += '?'
            for(let key in par){
                url += key + '=' +par[key] + '&'
            }
            url = url.slice(0,-1)            
        }
        console.log('get', url)
        return fetch(url,{
            method:'GET',
            headers:{
                'Content-Type':'application/json;charset=UTF-8'
            },
            cache:'default'
        })
        .then(res =>res.json())
    }
}

var net_work = new NetWork()
export default net_work
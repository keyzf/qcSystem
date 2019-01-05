//负责与互联网的交互
import dataStore from './dataStore'
import * as neo4j from 'neo4j'

class DataGetter{
    constructor(){
        // var neo4j = require('neo4j');
        // console.log(neo4j)
        this.neo4j = new neo4j.GraphDatabase('http://neo4j:123456@localhost:7474');
        // console.log(this.getPeopleList())
        // this.getPeopleList()
    }
    getNeo4J(){
        return this.neo4j
    }

    // 需要修改
    async getPeopleList(){
        let results = null
        this.neo4j.cypher({
            query: 'MATCH (n:Person) RETURN n.c_name_chn',
            params: {
                
            },
        }, (err, msg) => {
            if (err) throw err;
            results = msg
        })

        // var result = await this.neo4j.cypher({
        //     query: 'MATCH (n:Person) RETURN n.c_name_chn',
        //     params: {},
        // })
        return results
    }
    
    getPeopleID(person_name){
        return dataStore.person2id[person_name]  //返回值为数组
    }
    getPersonName(person_id){
        return dataStore.id2person[person_id]
    }
    getPersonRelationById(person_id, search_depth=1){
        let new_relations = dataStore.person2domestic_relation[person_id]
        if (new_relations) {
            if (search_depth>0) {
                new_relations.forEach( relation => {
                    let to_id = relation['to_id']
                    new_relations = [...new_relations, ...this.getPersonRelationById(to_id, search_depth-1)]
                })
            }
            return new_relations
        }else{
            return []
        }
    }
    getPeopleRelationByName(people_name, search_depth=1){
        let idArray = this.getPeopleID(people_name)
        if(idArray){
            let relationArray = []
            idArray.forEach(id => {
                relationArray = [...relationArray, ...this.getPersonRelationById(id, search_depth)]
            });
            return relationArray
        }else
            return []
    }

    isPoetByName(person_name){
        return dataStore.poet_list.has(person_name)
    }

    isPoetById(person_id){
        let person_name = this.getPersonName(person_id)
        return this.isPoetByName(person_name)
    }

    getPersonalTimeLineByName(person_name){
        return dataStore.time_line[person_name]
    }
}

const propety_name2db_propety_name = {
    'person_name': 'c_name_chn'
}

var dataGetter = new DataGetter
export default dataGetter
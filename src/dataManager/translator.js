class Translator{
    dict_cn2en = {}
    dict_en2cn = {}
    
    isChinese(word){
      var re=/[^/u4e00-/u9fa5]/;
      if (re.test(word)) 
        return false ;
      return true ;
    }

    cn2En(word){
        return word
    }

    en2cn(word){
        return word
    }
}

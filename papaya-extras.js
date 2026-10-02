// Shared extras rules; values sent to the existing API keep its original schema.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PapayaExtras=api;})(typeof window!=='undefined'?window:this,function(){
  function amount(value){const n=Number(typeof value==='string'?value.trim().replace(',','.'):value);return Number.isFinite(n)?n:0;}
  function cents(value){return Math.round(amount(value)*100);}
  function limit(group){return Math.max(1,Math.floor(amount(group.max_selections)||1));}
  function options(group){return (group.extras_options||[]).filter(o=>o.is_available!==false);}
  function selected(group,selections){const chosen=selections[group.id]||{};return options(group).filter(o=>Number.isInteger(chosen[o.id])&&chosen[o.id]>0);}
  function valid(groups,selections){return groups.every(g=>{const chosen=selected(g,selections);return (!g.is_mandatory||chosen.length>0)&&chosen.length<=limit(g)&&chosen.every(o=>g.allow_multiple||selections[g.id][o.id]===1);});}
  function summary(groups,selections){return groups.flatMap(g=>selected(g,selections).flatMap(o=>Array.from({length:g.allow_multiple?selections[g.id][o.id]:1},()=>({groupId:g.id,optionId:o.id,groupName:g.name,optionName:o.name,priceAdd:amount(o.price_add)}))));}
  function extrasCents(extras){return (Array.isArray(extras)?extras:[]).reduce((sum,e)=>sum+cents(e.priceAdd),0);}
  function lineTotal(base,extras,qty=1){return (cents(base)+extrasCents(extras))*amount(qty)/100;}
  function cartKey(product){
    const extras=product.selectedExtras||[];
    if(!extras.length)return String(product.id);
    const choices=extras.map(e=>[String(e.groupId??e.groupName),String(e.optionId??e.optionName),cents(e.priceAdd)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return String(product.id)+':extras:'+JSON.stringify(choices);
  }
  return {cartKey,amount,cents,limit,options,selected,valid,summary,extrasCents,lineTotal};
});

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const file = 'assets/scripts/page-offsets.js';
function fixture(height) {
  let current=height, observer, ready, resize;
  const styles = {};
  const header = {getBoundingClientRect:()=>({height:current})};
  class ResizeObserver {constructor(fn){observer=fn;} observe(element){assert.equal(element,header);}}
  const document = {readyState:'complete',querySelector:()=>header,documentElement:{style:{setProperty:(k,v)=>styles[k]=v}},addEventListener:(name,fn)=>ready=fn};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{document,window:{addEventListener:(name,fn)=>resize=fn},ResizeObserver});
  return {styles,resize(height){current=height;observer();}};
}
test('sticky offsets include the actual header and a readable gap',()=>{
  const p=fixture(132);assert.equal(p.styles['--cs-header-offset'],'148px');
});
test('offsets follow wrapped navigation and repeated viewport changes',()=>{
  const p=fixture(84);
  p.resize(149.2);assert.equal(p.styles['--cs-header-offset'],'166px');
  p.resize(70);assert.equal(p.styles['--cs-header-offset'],'86px');
  p.resize(84);assert.equal(p.styles['--cs-header-offset'],'100px');
});

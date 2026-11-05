const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/cluster-report.js', 'utf8');
function fixture(desktop) {
  const toc = {open:false};
  const media = {matches:desktop, addEventListener(type, handler) {this.onChange=handler;}};
  const document = {readyState:'complete', querySelector:s=>s==='.cs-report-toc'?toc:null, querySelectorAll:()=>[]};
  vm.runInNewContext(source,{document,window:{matchMedia:()=>media}});
  return {toc,resize(desktop){media.matches=desktop;media.onChange?.(media);}};
}
test('desktop report contents are expanded on load',()=>{assert.equal(fixture(true).toc.open,true);});
test('mobile report contents remain collapsed on load',()=>{assert.equal(fixture(false).toc.open,false);});
test('contents adapt to repeated breakpoint changes',()=>{
  const p=fixture(false);
  p.resize(true);assert.equal(p.toc.open,true);
  p.resize(false);assert.equal(p.toc.open,false);
  p.resize(true);assert.equal(p.toc.open,true);
});

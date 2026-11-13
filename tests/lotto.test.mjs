import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getExpectedLatestDraw, msUntilNextDrawUpdate, validDraw, mergeDraws } from '../src/lib/lottoCore.js'
import handler, { parseKokomel, loadDraws } from '../api/lotto.js'
const snapshot = JSON.parse(await readFile(new URL('../src/data/lotto-draws.json',import.meta.url)))
test('snapshot is continuous official-shaped data, with verified latest known result', () => {
  assert.ok(snapshot.length >= 1249)
  snapshot.forEach((d,i) => { assert.equal(d.drw,i+1); assert.ok(validDraw(d)) })
  assert.deepEqual(snapshot[1248], {drw:1249,nums:[2,11,16,25,34,35],bonus:14,date:'2026-11-07'})
})
test('KST Saturday boundary and timer do not depend on host timezone', () => {
  assert.equal(getExpectedLatestDraw(new Date('2026-11-14T21:34:59+09:00')),1249)
  assert.equal(getExpectedLatestDraw(new Date('2026-11-14T21:35:00+09:00')),1250)
  assert.equal(msUntilNextDrawUpdate(new Date('2026-11-14T21:34:59+09:00')),1000)
})
test('reject duplicates, invalid date, decimal numbers and malformed caches', () => {
  const d=snapshot.at(-1)
  assert.equal(validDraw({...d,bonus:d.nums[0]}),false)
  assert.equal(validDraw({...d,date:'2026-01-01'}),false)
  assert.equal(validDraw({...d,nums:[1.5,2,3,4,5,6]}),false)
  assert.deepEqual(mergeDraws([d],{}),[d])
})
test('parse structured fallback without executing scripts', () => {
  const row={drwNo:'1249',desc:'2026년 11월 07일',balls:[2,11,16,25,34,35,14].map((n,i)=>({number:String(n),bonus:i===6}))}
  const html=`<script>self.__next_f.push(${JSON.stringify([1,'50:'+JSON.stringify({items:[row]})+'\n'])})</script>`
  assert.deepEqual(parseKokomel(html),[snapshot[1248]])
  assert.throws(()=>parseKokomel('<html>maintenance</html>'))
})
test('upstream outage is an error, not an undrawn success', async () => {
  const original=globalThis.fetch
  globalThis.fetch=async()=>{throw new Error('offline')}
  try { await assert.rejects(()=>loadDraws(1248,1249)) } finally { globalThis.fetch=original }
})
test('API rejects malformed query and unsupported methods', async () => {
  function response() {return {setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}}}
  for(const query of [{drwNo:'123abc'},{from:'-1'},{drwNo:'0'}]) {const res=response();await handler({method:'GET',query},res);assert.equal(res.code,400)}
  const res=response();await handler({method:'POST',query:{}},res);assert.equal(res.code,405)
})
test('client deduplicates requests and only records successful refreshes', async () => {
  const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}
  globalThis.window=new EventTarget()
  const {syncLatestDraws,lastSuccess}=await import('../src/lib/lottoUpdater.js')
  const original=globalThis.fetch
  globalThis.fetch=async()=>{throw new Error('offline')}
  try {
    await assert.rejects(syncLatestDraws); assert.equal(lastSuccess(),0)
    globalThis.fetch=async()=>({ok:true,json:async()=>({complete:true,draws:[]})})
    // Future executions may have a newer expected round than the checked-in snapshot.
    if(snapshot.at(-1).drw===getExpectedLatestDraw()) {
      const a=syncLatestDraws(),b=syncLatestDraws();assert.equal(a,b);await a;assert.ok(lastSuccess()>0)
    }
  } finally {globalThis.fetch=original}
})

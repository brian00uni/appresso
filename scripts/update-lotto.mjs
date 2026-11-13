import { readFile, writeFile, rename } from 'node:fs/promises'
import { officialPage } from '../api/lotto.js'
import { getExpectedLatestDraw, mergeDraws } from '../src/lib/lottoCore.js'
const path = new URL('../src/data/lotto-draws.json', import.meta.url)
let previous = []
try { previous = JSON.parse(await readFile(path,'utf8')) } catch (e) { if (e.code !== 'ENOENT') throw e }
const target = getExpectedLatestDraw()
const from = previous.at(-1)?.drw ?? 0
const rounds = []
for (let n = target; n > from; n -= 10) rounds.push(n)
if (from === 0) rounds.push(1)
// Even with no new round, verify that the remote source is reachable.
if (rounds.length === 0) rounds.push(target)
const rows = []
for (let i=0;i<rounds.length;i+=4) {
  rows.push(...(await Promise.all(rounds.slice(i,i+4).map(officialPage))).flat())
  console.log(`공식 데이터 조회 ${Math.min(i+4,rounds.length)}/${rounds.length}`)
}
const merged = mergeDraws(previous,rows).filter(d=>d.drw<=target)
if (merged.length !== target || merged.some((d,i)=>d.drw!==i+1)) throw new Error('누락 회차가 있어 파일을 교체하지 않습니다')
await writeFile(new URL('../src/data/lotto-draws.json.tmp',import.meta.url), JSON.stringify(merged,null,2)+'\n')
await rename(new URL('../src/data/lotto-draws.json.tmp',import.meta.url),path)
console.log(`1~${target}회 공식 당첨번호 저장 완료`)

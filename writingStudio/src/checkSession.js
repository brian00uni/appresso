// 저장된 세션 유효성 확인 (CLI)
import { getStatus } from './naver.js'

getStatus()
  .then((s) => {
    if (!s.hasSession) {
      console.log('세션 파일이 없습니다. 먼저 npm run login (또는 npm run ui) 을 실행하세요.')
      process.exit(1)
    }
    if (s.valid) console.log(`\n✅ 세션 유효 — 로그인 계정 블로그: ${s.account}\n`)
    else console.log('\n⚠ 세션이 만료된 것 같습니다. 다시 로그인하세요.\n')
  })
  .catch((e) => { console.error(e); process.exit(1) })

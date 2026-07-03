// 네이버 1회 수동 로그인 → 세션 저장 (CLI). 대시보드는 npm run ui 참고.
import { saveSession } from './naver.js'

saveSession({ onLog: (m) => console.log('[login]', m) })
  .then(({ account }) => {
    console.log(`\n✅ 세션 저장 완료 (로그인 계정 블로그: ${account || '감지 실패'})`)
    console.log('   npm run check 로 확인할 수 있어요.\n')
  })
  .catch((e) => { console.error('\n❌', e.message); process.exit(1) })

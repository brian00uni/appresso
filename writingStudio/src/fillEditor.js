// 에디터 자동 입력 CLI (더미 콘텐츠로 파이프라인 검증)
//   npm run fill            헤드리스로 채우고 스크린샷 저장 (저장/발행 안 함)
//   HEADED=1 npm run fill   창을 띄워 확인
//   SAVE=1 npm run fill     임시저장까지 (발행은 절대 안 함)
import { fillEditor } from './editor.js'

const DUMMY = {
  title: 'Writing Studio 자동 입력 테스트',
  paragraphs: [
    '이 글은 Writing Studio가 스마트에디터에 자동으로 채워 넣은 테스트 문단입니다.',
    '제목과 본문이 정상적으로 입력되는지 확인하기 위한 더미 콘텐츠예요.',
    '#WritingStudio #자동화테스트',
  ],
}

fillEditor(DUMMY, {
  headed: !!process.env.HEADED,
  save: !!process.env.SAVE,
  keepOpen: !!process.env.HEADED, // 창을 띄웠으면 확인용으로 열어둠
  onLog: (m) => console.log('[fill]', m),
})
  .then(({ screenshot }) => {
    console.log(`\n✅ 완료 — 발행하지 않았습니다. 결과: ${screenshot}`)
    if (!process.env.HEADED) process.exit(0)
  })
  .catch((e) => { console.error('\n❌', e.message); process.exit(1) })

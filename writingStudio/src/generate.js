// Google Gemini API로 블로그 콘텐츠(제목·본문·태그·이미지 프롬프트) 생성
//
// 필요: writingStudio/.env 에 GEMINI_API_KEY=... (Google AI Studio에서 무료 발급)
//       모델 변경 시 GEMINI_MODEL=gemini-2.5-flash 등
// CLI:  node src/generate.js "주제" "키워드1,키워드2"

import { GoogleGenAI, Type } from '@google/genai'

// .env 로드 (없어도 무시)
try { process.loadEnvFile(new URL('../.env', import.meta.url)) } catch {}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// 구조화 출력 스키마 (Gemini responseSchema)
const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: '블로그 글 제목 (호기심을 끌되 과장·낚시 금지)' },
    paragraphs: { type: Type.ARRAY, description: '본문 문단들. 각 문단 2~4문장.', items: { type: Type.STRING } },
    tags: { type: Type.ARRAY, description: '해시태그 (# 없이 단어만)', items: { type: Type.STRING } },
    imagePrompts: { type: Type.ARRAY, description: '넣으면 좋을 이미지 설명(한국어)', items: { type: Type.STRING } },
  },
  required: ['title', 'paragraphs', 'tags', 'imagePrompts'],
  propertyOrdering: ['title', 'paragraphs', 'tags', 'imagePrompts'],
}

const SYSTEM = `너는 네이버 블로그 글을 쓰는 한국어 카피라이터다.
- 자연스럽고 정보성 있는 블로그 포스트를 쓴다.
- 과장·낚시성·AI 티 나는 표현은 피하고, 실제 경험처럼 구체적으로 쓴다.
- 문단은 3~7개, 각 문단은 2~4문장.
- 존댓말(~해요체)로 친근하게.`

// Gemini API 에러를 사람이 읽기 쉬운 한국어 메시지로 변환
function friendlyApiError(e) {
  const status = e?.status
  const raw = (e?.message || '').toString()
  const low = raw.toLowerCase()

  if (low.includes('api key not valid') || low.includes('api_key_invalid') || low.includes('permission_denied')) {
    return '🔑 Gemini API 키가 올바르지 않아요. writingStudio/.env 의 GEMINI_API_KEY 를 확인하고 서버를 재시작해 주세요.'
  }
  if (status === 429 || low.includes('resource_exhausted') || low.includes('quota') || low.includes('rate limit')) {
    return '⏳ Gemini 무료 티어 한도에 도달했어요. 잠시(1분쯤) 후 다시 시도하거나, 잠시 뒤에 다시 눌러 주세요.'
  }
  if (low.includes('safety') || low.includes('blocked') || low.includes('candidate')) {
    return '🚫 안전 필터에 걸렸어요. 주제나 표현을 조금 바꿔서 다시 시도해 주세요.'
  }
  if (low.includes('not found') || low.includes('model')) {
    return '⚠️ 모델을 찾을 수 없어요. .env 의 GEMINI_MODEL 값을 확인해 주세요(예: gemini-2.5-flash).'
  }
  if (low.includes('fetch failed') || low.includes('network') || low.includes('econn')) {
    return '🌐 네트워크 연결에 문제가 있어요. 인터넷 연결을 확인해 주세요.'
  }
  return '❌ 글 생성에 실패했어요: ' + raw.slice(0, 150)
}

/**
 * @param {{topic:string, keywords?:string, contentPrompt?:string, tone?:string}} opts
 * @returns {Promise<{title:string, paragraphs:string[], tags:string[], imagePrompts:string[]}>}
 */
export async function generateContent({ topic, keywords = '', contentPrompt = '', tone = '친근하고 실용적인' }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 가 없습니다. writingStudio/.env 에 키를 넣어주세요.')
  }
  if (!topic || !topic.trim()) throw new Error('주제(topic)를 입력하세요.')

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const userMsg =
    `주제: ${topic}\n` +
    `키워드: ${keywords || '(없음)'}\n` +
    `톤: ${tone}\n` +
    (contentPrompt && contentPrompt.trim()
      ? `\n[내용 가이드/구성 지시]\n${contentPrompt.trim()}\n`
      : '') +
    `\n위 주제·키워드·내용 가이드를 반영해 네이버 블로그 포스트를 작성해줘.`

  let res
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: userMsg,
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    })
  } catch (e) {
    throw new Error(friendlyApiError(e))
  }

  const text = res.text
  if (!text) throw new Error('글 생성 결과가 비어 있어요. 잠시 후 다시 시도해 주세요.')
  return JSON.parse(text)
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const topic = process.argv[2]
  const keywords = process.argv[3] || ''
  if (!topic) {
    console.error('사용법: node src/generate.js "주제" "키워드1,키워드2"')
    process.exit(1)
  }
  generateContent({ topic, keywords })
    .then((c) => {
      console.log('\n=== 제목 ===\n' + c.title)
      console.log('\n=== 본문 ===\n' + c.paragraphs.join('\n\n'))
      console.log('\n=== 태그 ===\n' + c.tags.map((t) => '#' + t).join(' '))
      console.log('\n=== 이미지 프롬프트 ===\n- ' + c.imagePrompts.join('\n- '))
    })
    .catch((e) => { console.error('\n❌', e.message); process.exit(1) })
}

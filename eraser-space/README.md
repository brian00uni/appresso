---
title: Eraser Studio
emoji: 🧽
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Eraser Studio — 영상 자막 지우개 (처리 엔진)

appresso `eraserStudio` 프론트엔드의 처리 백엔드입니다. FastAPI + OpenCV + ffmpeg,
HuggingFace **Docker Space(무료 CPU)** 에서 동작합니다.

## API

- `GET /` — 헬스체크
- `POST /remove` (multipart/form-data)
  - `video`: 영상 파일
  - `x, y, w, h`: 자막 박스 정규화 좌표(0~1, 좌상단 기준)
  - 응답: 자막이 제거된 `video/mp4`

## 배포 방법 (무료)

1. huggingface.co → **New Space** → SDK **Docker** 선택
2. 이 폴더(`eraser-space/`)의 `app.py`, `requirements.txt`, `Dockerfile`, `README.md` 업로드(또는 git push)
3. 빌드 완료 후 Space 주소 확인 → 예: `https://<user>-studioproj.hf.space`
4. Vercel 프로젝트 환경변수에 추가:
   ```
   VITE_ERASER_ENDPOINT=https://<user>-studioproj.hf.space
   ```
5. 재배포하면 프론트에서 실제 자막 제거가 동작합니다.

## 처리 방식

자막 박스 안에서 **글자 획만** 검출(밝은 글자 + 어두운 외곽선 임계값) → 팽창 →
그 픽셀만 `cv2.inpaint(TELEA)` 로 복원. 배경을 최대한 보존해 무료 CPU에서도 자연스럽게 지웁니다.

## 품질 업그레이드

`build_text_mask` / inpaint 부분을 **ProPainter**(비디오 인페인팅, ZeroGPU) 로 교체하면
움직이는 배경에서도 vmake 수준 품질을 낼 수 있습니다. 구조는 그대로 재사용됩니다.

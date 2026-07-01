# app.py — 자막 지우개 처리 엔진 (HuggingFace Space / Docker, 무료 CPU)
# POST /remove : 영상 + 자막박스(정규화 좌표) → 자막 제거된 mp4 반환
#
# 방식(무료 CPU 최적화):
#   자막 박스 "전체"가 아니라 박스 안 "글자 획"만 검출(밝은 글자+어두운 외곽선)
#   → 살짝 팽창 → 그 픽셀만 cv2.inpaint 로 복원. 배경은 최대한 보존.
# 업그레이드 포인트: build_text_mask / inpaint 부분을 ProPainter(ZeroGPU) 등으로 교체.

import os, tempfile, subprocess
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Eraser Studio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # 배포 후 Vercel 도메인으로 좁혀도 됨
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_text_mask(region_bgr):
    """박스 영역에서 자막 글자 픽셀만 마스크로 추출."""
    gray = cv2.cvtColor(region_bgr, cv2.COLOR_BGR2GRAY)
    # 밝은 글자(흰 자막)
    _, bright = cv2.threshold(gray, 190, 255, cv2.THRESH_BINARY)
    # 어두운 외곽선/그림자
    _, dark = cv2.threshold(gray, 55, 255, cv2.THRESH_BINARY_INV)
    mask = cv2.bitwise_or(bright, dark)
    # 획 주변까지 확실히 덮도록 팽창
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=2)
    return mask


@app.get("/")
def health():
    return {"ok": True, "service": "eraser-studio"}


@app.post("/remove")
def remove(
    video: UploadFile = File(...),
    x: float = Form(...), y: float = Form(...),
    w: float = Form(...), h: float = Form(...),
):
    tmp = tempfile.mkdtemp()
    src = os.path.join(tmp, "in.mp4")
    with open(src, "wb") as f:
        f.write(video.file.read())

    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 정규화 좌표 → 픽셀 영역
    rx, ry = int(x * W), int(y * H)
    rx2, ry2 = min(int((x + w) * W), W), min(int((y + h) * H), H)
    rx, ry = max(rx, 0), max(ry, 0)

    silent = os.path.join(tmp, "silent.mp4")
    out = cv2.VideoWriter(silent, cv2.VideoWriter_fourcc(*"mp4v"), fps, (W, H))

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        roi = frame[ry:ry2, rx:rx2]
        if roi.size:
            mask = build_text_mask(roi)
            frame[ry:ry2, rx:rx2] = cv2.inpaint(roi, mask, 3, cv2.INPAINT_TELEA)
        out.write(frame)

    cap.release()
    out.release()

    # 원본 오디오 다시 입히고, 브라우저 호환 위해 h264/aac 로 트랜스코드
    result = os.path.join(tmp, "out.mp4")
    cmd = [
        "ffmpeg", "-y", "-i", silent, "-i", src,
        "-map", "0:v:0", "-map", "1:a:0?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
        result,
    ]
    subprocess.run(cmd, capture_output=True)
    if not os.path.exists(result) or os.path.getsize(result) == 0:
        result = silent  # ffmpeg 실패 시 무음본이라도 반환

    return FileResponse(result, media_type="video/mp4", filename="subtitle-removed.mp4")

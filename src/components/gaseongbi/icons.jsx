import React from 'react'

// 가성비대장 — 요약 카드/사이드바 등에서 쓰는 작은 인라인 SVG 아이콘 모음
export const ICONS = {
  money: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 11.5v.5a1 1 0 102 0v-.5c1.333-.156 2.25-.94 2.25-2.156 0-1.39-1.135-1.93-2.25-2.25l-.5-.144C7.75 6.69 7.4 6.47 7.4 6.06c0-.42.4-.69 1-.69.61 0 1 .29 1.06.78a.75.75 0 001.49-.17C10.79 5.07 9.99 4.35 9 4.19V3.7a1 1 0 10-2 0v.5c-1.24.17-2.1.93-2.1 2.07 0 1.31 1.05 1.85 2.13 2.15l.5.144c.83.24 1.22.46 1.22.9 0 .47-.46.78-1.13.78-.7 0-1.16-.32-1.25-.86a.75.75 0 00-1.48.25c.16 1 1 1.7 2.13 1.86z" />
    </svg>
  ),
  pie: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M15.5 8.5h-7v-7a7.002 7.002 0 017 7zM7 1.07V8.5l5.25 5.25A7 7 0 117 1.07z" />
    </svg>
  ),
  warning: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 0L0 14h16L8 0zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zm0 6.5a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  ),
  priceUp: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 1l5 6h-3v8H6V7H3l5-6z" />
    </svg>
  ),
  coupon: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M1 5a2 2 0 012-2h10a2 2 0 012 2v1a1.5 1.5 0 000 3v1a2 2 0 01-2 2H3a2 2 0 01-2-2v-1a1.5 1.5 0 000-3V5zm6 0v1.5h2V5H7zm0 3v1.5h2V8H7zm0 3v1.5h2V11H7z" />
    </svg>
  ),
  ad: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M1 5v4a1 1 0 001 1h1l3.5 3v-11L3 5H2a1 1 0 00-1 0zm9.5 6.5L9 13V3l1.5 1.5a5 5 0 010 7zM12 6a3 3 0 010 4l1.2 1.2a5 5 0 000-6.4L12 6z" />
    </svg>
  ),
  ai: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 0a1 1 0 011 1v1h2a2 2 0 012 2v1h.5a1.5 1.5 0 010 3H13v2a2 2 0 01-2 2H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2V8h-.5a1.5 1.5 0 010-3H3V4a2 2 0 012-2h2V1a1 1 0 011-1zM6 6a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm-4.5 4a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5z" />
    </svg>
  ),
  excel: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M9 0H3a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5l-5-5zM5.5 7l1.5 2.2L8.5 7H10L7.8 10l2.2 3H8.5L7 10.8 5.5 13H4l2.2-3L4 7h1.5z" />
    </svg>
  ),
  store: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M1 2h14l-1 4H2L1 2zm1 5h12v7a1 1 0 01-1 1H9v-4H7v4H3a1 1 0 01-1-1V7z" />
    </svg>
  ),
  target: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 3a5 5 0 110 10A5 5 0 018 3zm0 3a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  crown: (
    <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
      <path d="M2 7l3 3 4-5 3 4 3-4 4 5 3-3-1.5 11h-17L2 7zm1.5 13h17v1.5h-17V20z" />
    </svg>
  ),
  location: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M8 0a5 5 0 00-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  ),
  group: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M5.5 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM11 7a2 2 0 100-4 2 2 0 000 4zM1 13c0-2.21 2.01-4 4.5-4S10 10.79 10 13v.5H1V13zM11.5 9c1.93 0 3.5 1.57 3.5 3.5V13h-3.55c.03-.16.05-.33.05-.5 0-1.16-.46-2.24-1.27-3.1.4-.26.84-.4 1.27-.4z" />
    </svg>
  ),
  map: (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
      <path d="M10 1L6 2.5 2 1v12l4 1.5 4-1.5 4 1.5V2L10 1zm-.5 11.3l-3-1.13V3.7l3 1.13v7.47z" />
    </svg>
  ),
}

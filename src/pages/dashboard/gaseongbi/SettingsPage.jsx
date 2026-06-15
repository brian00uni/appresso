import React, { useState } from 'react'
import { getSettings, saveSettings, resetAll, getStoreInfo, saveStoreInfo } from '../../../lib/gaseongbi/storage'
import { PLATFORM_ORDER, PLATFORMS, getPlatformDefaults } from '../../../lib/gaseongbi/platforms'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-6'

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => getSettings())
  const [storeInfo, setStoreInfo] = useState(() => getStoreInfo())
  const [saved, setSaved] = useState(false)

  const setStoreField = (key, value) => {
    setStoreInfo((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const setPlatformField = (platformId, key, value, isRate) => {
    setSettings((s) => ({
      ...s,
      platforms: {
        ...s.platforms,
        [platformId]: {
          ...getPlatformDefaults(platformId, s),
          [key]: value === '' ? 0 : isRate ? Number(value) / 100 : Number(value),
        },
      },
    }))
    setSaved(false)
  }

  const setDefaultField = (key, value) => {
    setSettings((s) => ({ ...s, defaults: { ...s.defaults, [key]: value } }))
    setSaved(false)
  }

  const handleSave = () => {
    saveSettings(settings)
    saveStoreInfo(storeInfo)
    setSaved(true)
  }

  const handleReset = () => {
    if (!window.confirm('모든 메뉴와 설정을 초기화할까요? 이 작업은 되돌릴 수 없어요.')) return
    resetAll()
    setSettings(getSettings())
    setSaved(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">설정</h1>

      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">매장 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>매장 이름</label>
            <input className={inputClass} value={storeInfo.storeName} onChange={(e) => setStoreField('storeName', e.target.value)} placeholder="예: 우리집 김밥집" />
          </div>
          <div>
            <label className={labelClass}>위치</label>
            <input className={inputClass} value={storeInfo.location} onChange={(e) => setStoreField('location', e.target.value)} placeholder="예: 서울 강남구" />
          </div>
          <div>
            <label className={labelClass}>대표 카테고리</label>
            <input className={inputClass} value={storeInfo.repCategory} onChange={(e) => setStoreField('repCategory', e.target.value)} placeholder="예: 김밥/분식" />
          </div>
        </div>
      </div>

      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">플랫폼별 기본값</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PLATFORM_ORDER.map((id) => {
            const platform = getPlatformDefaults(id, settings)
            return (
              <div key={id} className="border border-gray-100 dark:border-gray-700/60 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">{PLATFORMS[id].name}</h3>
                <div>
                  <label className={labelClass}>중개수수료율 (%)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={(platform.commissionRate * 100).toFixed(2)}
                    onChange={(e) => setPlatformField(id, 'commissionRate', e.target.value, true)}
                  />
                </div>
                <div>
                  <label className={labelClass}>카드수수료율 (%)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={(platform.cardFeeRate * 100).toFixed(2)}
                    onChange={(e) => setPlatformField(id, 'cardFeeRate', e.target.value, true)}
                  />
                </div>
                <div>
                  <label className={labelClass}>배달대행비 (원)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={platform.deliveryAgencyFee}
                    onChange={(e) => setPlatformField(id, 'deliveryAgencyFee', e.target.value, false)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">기본값</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>기준 플랫폼 (대시보드/리포트)</label>
            <select className={inputClass} value={settings.defaults.referencePlatform} onChange={(e) => setDefaultField('referencePlatform', e.target.value)}>
              {PLATFORM_ORDER.map((id) => (
                <option key={id} value={id}>
                  {PLATFORMS[id].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>목표 마진율 (%)</label>
            <input
              type="text"
              className={inputClass}
              value={(settings.defaults.targetMarginRate * 100).toFixed(1)}
              onChange={(e) => setDefaultField('targetMarginRate', (Number(e.target.value) || 0) / 100)}
            />
          </div>
          <div>
            <label className={labelClass}>기본 광고비 (1건당, 원)</label>
            <input
              type="text"
              className={inputClass}
              value={settings.defaults.adCost}
              onChange={(e) => setDefaultField('adCost', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>고객부담 배달팁 (원)</label>
            <input
              type="text"
              className={inputClass}
              value={settings.defaults.customerDeliveryTip}
              onChange={(e) => setDefaultField('customerDeliveryTip', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>사장님부담 쿠폰 (원)</label>
            <input
              type="text"
              className={inputClass}
              value={settings.defaults.ownerCoupon}
              onChange={(e) => setDefaultField('ownerCoupon', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>메뉴당 월 판매량 가정 (개)</label>
            <input
              type="text"
              className={inputClass}
              min={1}
              value={settings.defaults.monthlyUnitsPerMenu}
              onChange={(e) => setDefaultField('monthlyUnitsPerMenu', Math.max(1, Number(e.target.value) || 0))}
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600 text-violet-500 focus:ring-violet-500"
                checked={settings.defaults.vatIncluded}
                onChange={(e) => setDefaultField('vatIncluded', e.target.checked)}
              />
              부가세 포함 계산
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
        >
          설정 저장
        </button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">저장되었어요.</span>}
      </div>

      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">데이터 초기화</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">저장된 모든 메뉴와 설정을 삭제해요. 이 작업은 되돌릴 수 없어요.</p>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          전체 초기화
        </button>
      </div>
    </div>
  )
}

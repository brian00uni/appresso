// 가성비대장 — AI 사장님 코멘트 (v0.1 더미: 조건 분기 로직, 실제 AI API 미사용)

const TITLE = 'AI 사장님 코멘트'

export function getAiComment({ netProfit, marginRate }) {
  if (netProfit <= 0) {
    return {
      title: TITLE,
      tone: 'red',
      message: '지금 이 메뉴는 팔수록 손해를 보는 구조예요.',
      advice: '판매가, 식재료 원가, 쿠폰, 배달비를 다시 확인해 보세요.',
    }
  }

  if (marginRate < 0.1) {
    return {
      title: TITLE,
      tone: 'yellow',
      message: '쿠폰과 광고비를 같이 쓰면 위험할 수 있어요.',
      advice: '판매가를 조금 올리거나 쿠폰 금액을 줄이는 걸 고려해 보세요.',
    }
  }

  if (marginRate >= 0.2) {
    return {
      title: TITLE,
      tone: 'green',
      message: '기본 마진은 안정적인 편이에요.',
      advice: '광고비를 늘리기 전에 1건당 광고비가 얼마인지 먼저 확인해 보세요.',
    }
  }

  return {
    title: TITLE,
    tone: 'yellow',
    message: '마진은 양호하지만 여유가 큰 편은 아니에요.',
    advice: '쿠폰과 광고비 비중을 계속 관리해야 해요.',
  }
}

// 포트폴리오(전체 메뉴) 기준 AI 사장님 코멘트 — aggregateMenus 결과를 입력으로 받음
export function getAiCommentForAggregate(aggregate) {
  const { total, red, avgMarginRate } = aggregate
  if (total === 0) {
    return {
      title: TITLE,
      tone: 'yellow',
      message: '아직 등록된 메뉴가 없어요.',
      advice: '메뉴관리에서 메뉴를 등록하면 마진 분석을 시작할 수 있어요.',
    }
  }

  if (red > 0) {
    return {
      title: TITLE,
      tone: 'red',
      message: `현재 ${red}개 메뉴가 팔수록 손해를 보는 구조예요.`,
      advice: '위험 메뉴부터 판매가/원가/쿠폰을 점검해 보세요.',
    }
  }

  if (avgMarginRate < 0.1) {
    return {
      title: TITLE,
      tone: 'yellow',
      message: '전체 평균 마진율이 다소 낮은 편이에요.',
      advice: '쿠폰과 광고비 비중을 줄이거나 가격 조정이 필요한 메뉴를 확인해 보세요.',
    }
  }

  if (avgMarginRate >= 0.2) {
    return {
      title: TITLE,
      tone: 'green',
      message: '전체적으로 마진 구조가 안정적이에요.',
      advice: '광고비를 늘리기 전에 메뉴별 1건당 광고비를 점검해 보세요.',
    }
  }

  return {
    title: TITLE,
    tone: 'yellow',
    message: '전체 마진은 양호하지만 여유가 큰 편은 아니에요.',
    advice: '쿠폰·광고비 비중이 큰 메뉴를 중심으로 관리해 보세요.',
  }
}

// 광고비분석 — 광고비 회수율 기준 AI 사장님 코멘트
export function getAdAnalysisComment(recoveryRate, adWarningCount) {
  if (recoveryRate <= 0) {
    return {
      title: TITLE,
      tone: 'yellow',
      message: '설정에서 광고비를 입력하면 광고비 분석을 시작할 수 있어요.',
      advice: '1건당 광고비를 입력해보세요.',
    }
  }

  if (recoveryRate < 100) {
    return {
      title: TITLE,
      tone: 'red',
      message: `현재 광고비 회수율이 ${recoveryRate.toFixed(0)}%로, 광고를 할수록 손해를 보는 구조예요.`,
      advice: '광고비가 큰 메뉴를 중심으로 광고 예산을 줄이거나 판매가/원가를 다시 점검해 보세요.',
    }
  }

  if (recoveryRate < 150) {
    return {
      title: TITLE,
      tone: 'yellow',
      message: `광고비 회수율이 ${recoveryRate.toFixed(0)}%로 손익은 맞지만 여유가 크지 않아요.`,
      advice: adWarningCount > 0 ? `광고비 영향이 큰 ${adWarningCount}개 메뉴를 점검해 보세요.` : '현재 광고 예산을 유지하면서 메뉴별 회수 현황을 계속 지켜보세요.',
    }
  }

  return {
    title: TITLE,
    tone: 'green',
    message: `광고비 회수율이 ${recoveryRate.toFixed(0)}%로 안정적이에요.`,
    advice: '회수율이 높은 메뉴 위주로 광고 예산을 조금 더 늘려보는 것도 좋아요.',
  }
}

// 손익리포트 "월간 요약" 3줄 — aggregateMenus 결과 기반 규칙형 요약
export function getMonthlySummary(aggregate) {
  const { total, red, yellow, avgMarginRate, monthlyNetProfit, monthlyAdCost, adWarningList } = aggregate
  const lines = []

  if (total === 0) {
    lines.push('아직 등록된 메뉴가 없어요. 메뉴를 등록하면 월간 요약이 표시돼요.')
    return lines
  }

  lines.push(`등록 메뉴 기준 예상 손익은 ${monthlyNetProfit.toLocaleString('ko-KR')}원, 평균 마진율은 ${(avgMarginRate * 100).toFixed(1)}%예요.`)

  if (red > 0) {
    lines.push(`위험 메뉴가 ${red}개 있어요. 가격/원가/쿠폰 조정이 필요해요.`)
  } else if (yellow > 0) {
    lines.push(`주의 메뉴가 ${yellow}개 있어요. 마진율을 조금 더 끌어올릴 여지가 있어요.`)
  } else {
    lines.push('위험·주의 메뉴 없이 전체 메뉴가 안정적인 마진을 유지하고 있어요.')
  }

  if (monthlyAdCost > 0 && adWarningList.length > 0) {
    lines.push(`광고비 영향으로 ${adWarningList.length}개 메뉴의 수익성이 크게 낮아지고 있어요. 광고 예산 재배분을 검토해 보세요.`)
  } else {
    lines.push('광고비로 인한 수익성 악화 메뉴는 발견되지 않았어요.')
  }

  return lines
}

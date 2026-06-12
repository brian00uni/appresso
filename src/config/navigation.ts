import { LayoutDashboard, Bell, CalendarDays, FolderOpen, Users, PlayCircle } from 'lucide-react'

export const 메뉴목록 = [
  { 경로: '/',             아이콘: LayoutDashboard, 이름: '대시보드' },
  { 경로: '/youtube',      아이콘: PlayCircle,       이름: '유튜브 분석' },
  { 경로: '/notice',       아이콘: Bell,             이름: '공지사항' },
  { 경로: '/calendar',     아이콘: CalendarDays,     이름: '업무일정' },
  { 경로: '/documents',    아이콘: FolderOpen,       이름: '문서자료' },
  { 경로: '/organization', 아이콘: Users,            이름: '조직도' },
] as const

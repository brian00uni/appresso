import React, { useState } from 'react'
import { ko } from 'date-fns/locale'
import ThemeToggle from '../../components/ThemeToggle'
import UserMenu from '../../components/DropdownProfile'
import { Calendar } from '../../components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${WEEKDAYS[date.getDay()]})`
}

export default function GaseongbiHeader({ sidebarOpen, setSidebarOpen }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  return (
    <header className="sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 max-lg:shadow-xs lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:border-b border-gray-200 dark:border-gray-700/60">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => {
                e.stopPropagation()
                setSidebarOpen(!sidebarOpen)
              }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 16 16">
                    <path d="M5 0a1 1 0 0 1 1 1v1h4V1a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1V1a1 1 0 0 1 1-1ZM2 6v7h12V6H2Z" />
                  </svg>
                  <span>{formatDateLabel(selectedDate)}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ko}
                  defaultMonth={selectedDate}
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            <select
              className="text-sm bg-transparent border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-violet-500"
              defaultValue="recommended"
            >
              <option value="recommended">권장값 대비</option>
              <option value="target">목표 마진 대비</option>
            </select>

            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full relative">
              <span className="sr-only">Notifications</span>
              <svg className="fill-current text-gray-500/80 dark:text-gray-400/80" width={16} height={16} viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM8 1a4 4 0 0 0-4 4v2.5c0 .818-.343 2.073-1 3a.5.5 0 0 0 .406.79h9.188A.5.5 0 0 0 13 10.5c-.657-.927-1-2.182-1-3V5a4 4 0 0 0-4-4Z" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500"></span>
            </button>

            <ThemeToggle />
            <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />
            <UserMenu align="right" />
          </div>
        </div>
      </div>
    </header>
  )
}

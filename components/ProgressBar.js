'use client'

export default function ProgressBar({ progress = 0, total = 6 }) {
  const percentage = Math.round((progress / total) * 100)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Progress
        </span>
        <span className="text-sm font-semibold text-indigo-600">
          {progress} / {total} weeks ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


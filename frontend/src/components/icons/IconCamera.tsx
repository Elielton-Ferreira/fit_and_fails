import React from 'react'

type Props = {
  className?: string
}

const IconCamera: React.FC<Props> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M9 7l1-2h4l1 2" />
    <circle cx="12" cy="13" r="4" />
    <path d="M17.5 9.5v.01" />
  </svg>
)

export default IconCamera

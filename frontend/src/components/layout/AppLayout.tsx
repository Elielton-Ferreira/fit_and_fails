import type { ReactNode } from 'react'
import Sidebar from '../navigation/Sidebar'
import BottomNav from '../navigation/BottomNav'

const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
    <div className="lg:sticky lg:top-8 lg:self-start">
      <Sidebar />
    </div>
    <main className="flex-1 pb-24 lg:pb-0">{children}</main>
    <BottomNav />
  </div>
)

export default AppLayout

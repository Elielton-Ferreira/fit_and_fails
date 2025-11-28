import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import WaterPage from './pages/WaterPage'
import ScreenTimePage from './pages/ScreenTimePage'
import ExercisePage from './pages/ExercisePage'
import ProfilePage from './pages/ProfilePage'
import CreatePostPage from './pages/CreatePostPage'
import { useAuth } from './modules/auth/AuthContext'

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const App = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/water"
        element={
          <RequireAuth>
            <WaterPage />
          </RequireAuth>
        }
      />
      <Route
        path="/book"
        element={
          <RequireAuth>
            <ScreenTimePage />
          </RequireAuth>
        }
      />
      <Route path="/screen" element={<Navigate to="/book" replace />} />
      <Route
        path="/exercise"
        element={
          <RequireAuth>
            <ExercisePage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/create"
        element={
          <RequireAuth>
            <CreatePostPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App

import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, signOut } = useAuth()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
          <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-1">{user?.email}</p>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <button
            onClick={signOut}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

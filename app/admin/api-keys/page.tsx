"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  key: string
  isActive: boolean
  createdBy: string
  createdAt: string
  lastUsedAt: string | null
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchApiKeys()
    }
  }, [status, session, router])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys")
      const data = await response.json()
      if (data.apiKeys) {
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName })
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedKey(data.key)
        setNewKeyName("")
        fetchApiKeys()
      } else {
        alert(data.error || "Failed to create API key")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus })
      })

      if (response.ok) {
        fetchApiKeys()
      } else {
        alert("Failed to update API key")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/api-keys?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        alert("API key deleted successfully")
        fetchApiKeys()
      } else {
        alert("Failed to delete API key")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-red-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">API Key Management</h1>
              <p className="text-red-100 mt-1">Generate and manage API keys for external systems</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-100">Administrator</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active API Keys</h2>
            <p className="text-sm text-gray-600">Manage access to your public APIs</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            + Generate New Key
          </button>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔑</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-4">Create your first API key to allow external systems to access your data.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                + Generate New Key
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                        <div className="text-xs text-gray-500">Created {new Date(apiKey.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {apiKey.key.substring(0, 20)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                            title="Copy full key"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          apiKey.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apiKey.lastUsedAt 
                          ? new Date(apiKey.lastUsedAt).toLocaleString()
                          : "Never used"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                            className={`px-3 py-1 rounded font-medium ${
                              apiKey.isActive
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {apiKey.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Documentation Link */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">📚 API Documentation</h3>
          <p className="text-sm text-blue-800 mb-3">
            Share the API documentation with external developers to help them integrate with your system.
          </p>
          <a 
            href="/docs/PUBLIC_EVENTS_API.md" 
            target="_blank"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            View API Documentation
          </a>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Generate New API Key</h2>
            </div>
            <form onSubmit={handleCreateKey} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name / Description *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., PHP Website Integration"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give this key a descriptive name to identify its purpose
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewKeyName("")
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">🎉 API Key Generated!</h2>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-bold text-yellow-900 mb-2">⚠️ Important - Save This Key Now!</p>
                <p className="text-sm text-yellow-800">
                  This is the only time you'll see the full API key. Copy it now and store it securely. 
                  You won't be able to retrieve it again.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-gray-900 bg-white px-4 py-3 rounded border border-gray-300 break-all">
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-bold text-blue-900 mb-2">📖 How to Use:</p>
                <p className="text-sm text-blue-800 mb-2">Include this key in the request header:</p>
                <code className="block text-xs font-mono bg-white p-2 rounded border border-blue-300 text-gray-900">
                  x-api-key: {generatedKey}
                </code>
              </div>

              <button
                onClick={() => setGeneratedKey(null)}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                I've Saved the Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

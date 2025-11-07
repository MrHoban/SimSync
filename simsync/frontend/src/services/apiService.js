// API service for backend communication
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  }

  // Get auth token from Firebase
  async getAuthToken() {
    const { auth } = await import('../firebase')
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    const token = await user.getIdToken()
    console.log('Generated token (first 50 chars):', token.substring(0, 50) + '...')
    return token
  }

  // Helper method for API calls
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    try {
      const token = await this.getAuthToken()
      
      const defaultOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      }

      // Merge options
      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // If it's a 401 and we haven't retried yet, wait a bit and try again
        // This handles the "token used too early" timing issue
        if (response.status === 401 && retryCount < 2) {
          console.log(`Authentication failed, retrying in ${(retryCount + 1) * 500}ms...`)
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500))
          return this.makeRequest(endpoint, options, retryCount + 1)
        }
        
        throw new Error(errorData.detail || 'Authentication failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async verifyUser() {
    return this.makeRequest('/auth/verify')
  }

  async getUserInfo(userId) {
    return this.makeRequest(`/auth/user/${userId}`)
  }

  // File endpoints
  async uploadFile(file) {
    try {
      const token = await this.getAuthToken()
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }

  async listFiles() {
    return this.makeRequest('/files/list')
  }

  async deleteFile(fileId) {
    return this.makeRequest(`/files/delete/${fileId}`, {
      method: 'DELETE'
    })
  }

  // Payment methods
  async createCheckoutSession(userId, successUrl, cancelUrl) {
    return this.makeRequest('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        success_url: successUrl,
        cancel_url: cancelUrl
      })
    })
  }

  // Community sharing methods
  async shareFile(fileId, description = '') {
    return this.makeRequest('/community/share', {
      method: 'POST',
      body: JSON.stringify({
        file_id: fileId,
        description: description
      })
    })
  }

  async getCommunityFiles(limit = 50, offset = 0) {
    return this.makeRequest(`/community/files?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    })
  }

  async downloadCommunityFile(sharedFileId) {
    return this.makeRequest(`/community/${sharedFileId}/download`, {
      method: 'POST'
    })
  }

  async rateCommunityFile(sharedFileId, rating) {
    return this.makeRequest(`/community/${sharedFileId}/rate`, {
      method: 'POST',
      body: JSON.stringify({
        rating: rating
      })
    })
  }

  async unshareFile(sharedFileId) {
    return this.makeRequest(`/community/${sharedFileId}`, {
      method: 'DELETE'
    })
  }
}

// Create and export a singleton instance
export const apiService = new ApiService()

// Export individual methods for convenience
export const {
  verifyUser,
  getUserInfo,
  uploadFile,
  listFiles,
  deleteFile,
  createCheckoutSession,
  shareFile,
  getCommunityFiles,
  downloadCommunityFile,
  rateCommunityFile,
  unshareFile
} = apiService
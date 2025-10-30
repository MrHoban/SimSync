import React, { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { apiService } from '../services/apiService'

const Dashboard = () => {
    const [uploading, setUploading] = useState(false)
    const [backups, setBackups] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadProgress, setUploadProgress] = useState([])
    const [dragOver, setDragOver] = useState(false)

    // Load user's backups when component mounts
    useEffect(() => {
        // Add a small delay to ensure authentication token is ready
        // This prevents the "token used too early" error after login
        const timer = setTimeout(() => {
            loadBackups()
        }, 500) // 500ms delay (reduced since backend now handles timing better)

        return () => clearTimeout(timer)
    }, [])

    const testBackendConnection = async () => {
        try {
            console.log('Testing backend connection...')
            
            // Test 1: No auth required endpoint
            const testResponse = await fetch('http://localhost:8000/api/auth/test')
            const testData = await testResponse.json()
            console.log('Test endpoint response:', testData)
            
            // Test 2: Try to get a token
            const user = auth.currentUser
            if (!user) {
                console.log('No user logged in!')
                return
            }
            
            console.log('Current user:', user.uid)
            const token = await user.getIdToken(true) // Force refresh
            console.log('Token obtained, length:', token.length)
            
            // Test 3: Try to verify token
            const verifyResponse = await fetch('http://localhost:8000/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            
            if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json()
                console.log('Token verification successful:', verifyData)
            } else {
                const errorData = await verifyResponse.json()
                console.log('Token verification failed:', errorData)
            }
            
        } catch (error) {
            console.error('Backend test failed:', error)
        }
    }

    const loadBackups = async () => {
        try {            
            const response = await apiService.listFiles()
            setBackups(response.files || [])
        } catch (error) {
            console.error('Error loading backups:', error)
            
            // If it's an authentication error, it might be a timing issue
            if (error.message.includes('Authentication failed') || error.message.includes('401')) {
                console.log('Authentication timing issue detected. Files will retry automatically.')
            } else {
                console.log('Note: This is normal if no files have been uploaded yet')
            }
        }
        setLoading(false)
    }

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files)
        if (files.length === 0) return

        setUploading(true)
        
        // Initialize progress tracking
        const initialProgress = files.map((file, index) => ({
            id: index,
            name: file.name,
            size: file.size,
            status: 'waiting', // waiting, uploading, completed, error
            progress: 0
        }))
        setUploadProgress(initialProgress)

        try {
            let completedCount = 0
            const errors = []

            // Upload files with individual progress tracking
            const uploadPromises = files.map(async (file, index) => {
                try {
                    // Update status to uploading
                    setUploadProgress(prev => 
                        prev.map(item => 
                            item.id === index 
                                ? { ...item, status: 'uploading', progress: 0 }
                                : item
                        )
                    )

                    const response = await apiService.uploadFile(file)
                    
                    // Update status to completed
                    setUploadProgress(prev => 
                        prev.map(item => 
                            item.id === index 
                                ? { ...item, status: 'completed', progress: 100 }
                                : item
                        )
                    )
                    
                    completedCount++
                    return response
                } catch (error) {
                    // Update status to error
                    setUploadProgress(prev => 
                        prev.map(item => 
                            item.id === index 
                                ? { ...item, status: 'error', progress: 0 }
                                : item
                        )
                    )
                    errors.push(`${file.name}: ${error.message}`)
                    throw error
                }
            })

            // Wait for all uploads to complete (or fail)
            const results = await Promise.allSettled(uploadPromises)
            
            // Show detailed results
            if (errors.length === 0) {
                alert(`🎉 Successfully uploaded all ${completedCount} file(s)!\n\nYour custom content is now safely backed up in the cloud.`)
            } else if (completedCount > 0) {
                alert(`⚠️ Partial success: ${completedCount} of ${files.length} files uploaded successfully.\n\nErrors:\n${errors.join('\n')}`)
            } else {
                alert(`❌ Upload failed for all files.\n\nErrors:\n${errors.join('\n')}`)
            }

            // Reload backups to show new files
            if (completedCount > 0) {
                loadBackups()
            }

        } catch (error) {
            console.error('Error uploading files:', error)
            alert(`Error uploading files: ${error.message}`)
        }

        setUploading(false)
        // Clear progress after a delay
        setTimeout(() => setUploadProgress([]), 3000)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length === 0) return

        // Filter files by accepted types
        const acceptedExtensions = ['.package', '.trayitem', '.zip', '.rar', '.7z', '.ts4script', '.py', '.txt', '.md']
        const validFiles = droppedFiles.filter(file => 
            acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        )

        if (validFiles.length === 0) {
            alert('No valid files found. Please drop files with supported extensions:\n.package, .trayitem, .zip, .rar, .7z, .ts4script, .py, .txt, .md')
            return
        }

        if (validFiles.length < droppedFiles.length) {
            const invalidCount = droppedFiles.length - validFiles.length
            alert(`${invalidCount} file(s) were skipped because they have unsupported file types.\n\nProceeding with ${validFiles.length} valid file(s).`)
        }

        // Create a mock event to reuse the existing upload handler
        const mockEvent = {
            target: {
                files: validFiles
            }
        }
        handleFileUpload(mockEvent)
    }

    const handleDownload = async (file, event) => {
        const downloadBtn = event?.target
        let originalText = 'Download'
        
        if (downloadBtn) {
            originalText = downloadBtn.textContent
            downloadBtn.textContent = 'Downloading...'
            downloadBtn.disabled = true
        }

        try {
            // Show confirmation dialog first
            const confirmDownload = confirm(
                `Ready to download "${file.name}"?\n\n` +
                `File size: ${formatFileSize(file.size)}\n\n` +
                `Click OK to start download.`
            )

            if (!confirmDownload) {
                // User cancelled
                if (downloadBtn) {
                    downloadBtn.textContent = originalText
                    downloadBtn.disabled = false
                }
                return
            }

            // Open file in new window - this will trigger browser's download dialog
            const newWindow = window.open(file.download_url, '_blank')
            
            // Fallback: if popup blocked, create download link
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // Popup was blocked, use anchor method
                const link = document.createElement('a')
                link.href = file.download_url
                link.download = file.name
                link.target = '_blank'
                link.rel = 'noopener noreferrer'
                
                // Add to document, click, and remove
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }

            // Success message
            alert(`Download initiated for "${file.name}"! Check your Downloads folder and browser's download manager.`)

        } catch (error) {
            console.error('Error downloading backup:', error)
            alert(`Error downloading backup: ${error.message}`)
        } finally {
            // Restore button state
            if (downloadBtn) {
                downloadBtn.textContent = originalText
                downloadBtn.disabled = false
            }
        }
    }

    const handleDelete = async (file) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return

        try {
            // Delete file through API
            await apiService.deleteFile(file.id)
            
            // Show success message
            alert('File deleted successfully!')

            // Reload files
            loadBackups()

        } catch (error) {
            console.error('Error deleting file:', error)
            alert(`Error deleting file: ${error.message}`)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleSignOut = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    if (loading) {
        return (
            <div className="loading-spinner">
                <div>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '16px', color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>Loading your backups...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">🧩 SimSync Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back, {auth.currentUser?.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="btn-secondary"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Upload Section */}
                <div className="upload-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--sims-dark-gray)', marginBottom: '20px' }}>
                        🚀 Upload New Backup
                    </h2>

                    <div 
                        className="upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            border: dragOver ? '2px dashed var(--sims-green)' : '2px dashed var(--sims-gray)',
                            backgroundColor: dragOver ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                        }}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                            id="file-upload"
                            accept=".package,.trayitem,.zip,.rar,.7z,.ts4script,.py,.txt,.md"
                        />
                        <label
                            htmlFor="file-upload"
                            style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                            {uploading ? (
                                <div>
                                    <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }}></div>
                                    <p style={{ color: 'var(--sims-gray)', fontSize: '1rem', fontWeight: '600' }}>Uploading your files...</p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--sims-dark-gray)', marginBottom: '8px' }}>
                                        {dragOver ? '📂 Drop your files here!' : 'Click to select or drag & drop your files'}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--sims-gray)' }}>
                                        Supports .package, .trayitem, .zip, .rar, .7z, .ts4script, .py, .txt, .md files
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--sims-orange)', marginTop: '4px', fontWeight: '600' }}>
                                        💡 Select multiple files for bulk upload
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress.length > 0 && (
                    <div className="upload-card" style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--sims-dark-gray)', marginBottom: '16px' }}>
                            📊 Upload Progress
                        </h3>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {uploadProgress.map((file) => (
                                <div key={file.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '8px 12px', 
                                    marginBottom: '8px',
                                    backgroundColor: 'var(--sims-light-gray)',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem'
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontWeight: '600', 
                                            color: 'var(--sims-dark-gray)',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {file.name}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.8rem', 
                                            color: 'var(--sims-gray)',
                                            marginTop: '2px'
                                        }}>
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: '12px', textAlign: 'right', minWidth: '80px' }}>
                                        {file.status === 'waiting' && <span style={{ color: 'var(--sims-gray)' }}>⏳ Waiting</span>}
                                        {file.status === 'uploading' && <span style={{ color: 'var(--sims-orange)' }}>⬆️ Uploading</span>}
                                        {file.status === 'completed' && <span style={{ color: 'var(--sims-green)' }}>✅ Done</span>}
                                        {file.status === 'error' && <span style={{ color: 'var(--sims-red)' }}>❌ Failed</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Backups List */}
                <div className="backups-card">
                    <div className="backups-header">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--sims-blue)' }}>💾 Your Files</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--sims-gray)', marginTop: '4px', fontWeight: '500' }}>
                            {backups.length} file(s) uploaded
                        </p>
                    </div>

                    {backups.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sims-gray)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📦</div>
                            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No files uploaded yet. Upload your first files above!</p>
                        </div>
                    ) : (
                        <div>
                            {backups.map((file) => (
                                <div key={file.id} className="backup-item">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--sims-dark-gray)' }}>
                                                📄 {file.name}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--sims-gray)', marginTop: '4px' }}>
                                                Size: {formatFileSize(file.size)} • 
                                                Uploaded: {new Date(file.upload_date).toLocaleDateString()} • 
                                                Type: {file.content_type}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={(e) => handleDownload(file, e)}
                                                className="btn-download"
                                            >
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file)}
                                                className="btn-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Footer */}
            <footer style={{
                marginTop: '40px',
                padding: '20px',
                textAlign: 'center',
                borderTop: '2px solid var(--sims-light-gray)',
                backgroundColor: 'var(--sims-light-gray)',
                borderRadius: '8px'
            }}>
                <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--sims-gray)',
                    margin: '0 0 8px 0'
                }}>
                    Having issues or need help with SimSync?
                </p>
                <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--sims-dark-gray)',
                    fontWeight: '600',
                    margin: '0'
                }}>
                    📧 Contact Us: <a 
                    href="mailto:joshuawhoban@gmail.com"
                    style={{
                        color: 'var(--sims-green)',
                        textDecoration: 'none',
                        fontWeight: '700'
                    }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    joshuawhoban@gmail.com
                </a>
                </p>
            </footer>
        </div>
    )
}

export default Dashboard
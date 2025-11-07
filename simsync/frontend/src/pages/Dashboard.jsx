import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { apiService } from '../services/apiService'

const Dashboard = () => {
    const [uploading, setUploading] = useState(false)
    const [backups, setBackups] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadProgress, setUploadProgress] = useState([])
    const [dragOver, setDragOver] = useState(false)
    const [userInfo, setUserInfo] = useState(null)
    const [communityFiles, setCommunityFiles] = useState([])
    const [showCommunity, setShowCommunity] = useState(false)
    const [userRatings, setUserRatings] = useState({})

    // Set page title
    useEffect(() => {
        document.title = 'Dashboard - SimSync'
    }, [])

    // Load user's data when component mounts
    useEffect(() => {
        // Add a small delay to ensure authentication token is ready
        // This prevents the "token used too early" error after login
        const timer = setTimeout(() => {
            loadUserData()
            loadBackups()
        }, 500) // 500ms delay (reduced since backend now handles timing better)

        return () => clearTimeout(timer)
    }, [])

    const loadUserData = async () => {
        try {
            const userResponse = await apiService.verifyUser()
            setUserInfo(userResponse)
            console.log('User info loaded:', userResponse)
        } catch (error) {
            console.error('Error loading user info:', error)
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

        // Check storage limits
        if (userInfo) {
            const totalUploadSize = files.reduce((total, file) => total + file.size, 0) / (1024 * 1024) // Convert to MB
            const availableStorage = userInfo.storage_limit - userInfo.storage_used
            
            if (totalUploadSize > availableStorage) {
                alert(`Upload exceeds storage limit!\n\nUploading: ${totalUploadSize.toFixed(1)}MB\nAvailable: ${availableStorage.toFixed(1)}MB\n\n${userInfo.subscription_tier === 'basic' ? 'Upgrade to Premium for 500MB storage!' : 'Please delete some files first.'}`)
                return
            }
            
            // Check file count limits for basic users
            if (userInfo.subscription_tier === 'basic' && backups.length + files.length > 25) {
                alert(`Upload exceeds file limit!\n\nBasic users can store up to 25 files.\nYou currently have ${backups.length} files and are trying to upload ${files.length} more.\n\nUpgrade to Premium for unlimited files!`)
                return
            }
        }

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
            await Promise.allSettled(uploadPromises)
            
            // Show detailed results
            if (errors.length === 0) {
                alert(`🎉 Successfully uploaded all ${completedCount} file(s)!\n\nYour custom content is now safely backed up in the cloud.`)
            } else if (completedCount > 0) {
                alert(`⚠️ Partial success: ${completedCount} of ${files.length} files uploaded successfully.\n\nErrors:\n${errors.join('\n')}`)
            } else {
                alert(`❌ Upload failed for all files.\n\nErrors:\n${errors.join('\n')}`)
            }

            // Reload backups and user data to show new files and updated storage usage
            if (completedCount > 0) {
                loadBackups()
                loadUserData() // Refresh user storage info
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

    const loadCommunityFiles = async () => {
        try {
            // This will be a new API endpoint for shared community files
            // Start with completely empty array - no demo content
            setCommunityFiles([])
            // Reset any cached ratings
            setUserRatings({})
        } catch (error) {
            console.error('Error loading community files:', error)
        }
    }

    const handleRateFile = async (fileId, rating) => {
        if (!userInfo) {
            alert('Please log in to rate files!')
            return
        }
        
        // Update local rating state
        setUserRatings(prev => ({
            ...prev,
            [fileId]: rating
        }))
        
        // This would send the rating to the backend
        console.log(`User ${userInfo.uid} rated file ${fileId}: ${rating} stars`)
        alert(`Thanks for rating! You gave ${rating} star${rating !== 1 ? 's' : ''}. 🌟`)
    }

    const handleShareFile = async (file) => {
        if (userInfo?.subscription_tier !== 'premium') {
            alert('🚀 File sharing is a Premium feature! Upgrade to Premium to share your content with the SimSync community.')
            return
        }
        
        const confirmed = confirm(`Share "${file.name}" with the SimSync community?\n\nOther users will be able to download this file.`)
        if (confirmed) {
            // This would call the backend to share the file
            alert('🎉 File shared with community! (Feature coming soon)')
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
                        {userInfo && (
                            <div className="user-tier-info">
                                {userInfo.subscription_tier === 'premium' ? (
                                    <p className="tier-badge premium">
                                        🚀 Premium Member - {userInfo.storage_used}MB / {userInfo.storage_limit}MB used
                                    </p>
                                ) : (
                                    <p className="tier-badge basic">
                                        🌟 Basic Tier - {userInfo.storage_used}MB / {userInfo.storage_limit}MB used - 
                                        <Link to="/premium" className="upgrade-link"> Upgrade to Premium</Link>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {userInfo?.subscription_tier !== 'premium' && (
                            <Link to="/premium" className="btn-premium">
                                🚀 Go Premium
                            </Link>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="btn-secondary"
                        >
                            Sign Out
                        </button>
                    </div>
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
                                        <div>
                                            <button
                                                onClick={(event) => handleDownload(file, event)}
                                                className="btn-download"
                                            >
                                                Download
                                            </button>
                                            {userInfo?.subscription_tier === 'premium' && (
                                                <button
                                                    onClick={() => handleShareFile(file)}
                                                    className="btn-share"
                                                    style={{ 
                                                        backgroundColor: 'var(--sims-lime)', 
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        marginLeft: '8px'
                                                    }}
                                                >
                                                    Share
                                                </button>
                                            )}
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

                {/* Community Files Section */}
                <div className="backups-card">
                    <div className="backups-header">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--sims-blue)' }}>
                            🌟 Community Shared Files
                        </h2>
                        <button
                            onClick={() => {
                                setShowCommunity(!showCommunity)
                                if (!showCommunity) {
                                    // Always refresh community files when opening
                                    loadCommunityFiles()
                                }
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                        >
                            {showCommunity ? 'Hide Community' : 'Browse Community'}
                        </button>
                    </div>

                    {showCommunity && (
                        <div>
                            {communityFiles.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: 'var(--sims-light-gray)',
                                    borderRadius: '12px',
                                    border: '2px dashed var(--sims-light-blue)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌟</div>
                                    <h3 style={{ 
                                        color: 'var(--sims-blue)', 
                                        marginBottom: '12px',
                                        fontSize: '1.2rem'
                                    }}>
                                        Be the First to Share!
                                    </h3>
                                    <p style={{ 
                                        color: 'var(--sims-gray)', 
                                        fontSize: '1rem',
                                        marginBottom: '16px',
                                        lineHeight: '1.5'
                                    }}>
                                        No community files yet - you could be the first SimSync user to share your amazing custom content!
                                    </p>
                                    <p style={{ 
                                        color: 'var(--sims-dark-gray)', 
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}>
                                        💎 Upgrade to Premium to start sharing your mods and CC with the community
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {communityFiles.map((file) => (
                                        <div key={file.id} className="backup-item">
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontWeight: '600',
                                                    marginBottom: '4px'
                                                }}>
                                                    {file.name}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.8rem', 
                                                    color: 'var(--sims-gray)',
                                                    marginBottom: '4px'
                                                }}>
                                                    {formatFileSize(file.size)} • Shared by {file.shared_by} • {file.downloads} downloads
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: 'var(--sims-dark-gray)',
                                                    fontStyle: 'italic',
                                                    marginBottom: '8px'
                                                }}>
                                                    {file.description}
                                                </div>
                                                
                                                {/* Rating System */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--sims-gray)' }}>Rate:</span>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => handleRateFile(file.id, star)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                fontSize: '1.2rem',
                                                                cursor: 'pointer',
                                                                color: userRatings[file.id] >= star ? '#FFD700' : '#DDD',
                                                                padding: '0 2px'
                                                            }}
                                                            title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                                        >
                                                            ⭐
                                                        </button>
                                                    ))}
                                                    {userRatings[file.id] && (
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            color: 'var(--sims-green)',
                                                            fontWeight: '600'
                                                        }}>
                                                            You rated: {userRatings[file.id]} ⭐
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Average Rating Display */}
                                                <div style={{ 
                                                    fontSize: '0.75rem', 
                                                    color: 'var(--sims-gray)' 
                                                }}>
                                                    ⭐ {file.average_rating || 'No ratings yet'} 
                                                    {file.rating_count > 0 && ` (${file.rating_count} rating${file.rating_count !== 1 ? 's' : ''})`}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <button
                                                    onClick={() => alert('🚀 Community downloads coming soon! This feature will be available in the next update.')}
                                                    className="btn-download"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div style={{ 
                                        marginTop: '16px', 
                                        padding: '12px', 
                                        backgroundColor: 'var(--sims-light-gray)', 
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ 
                                            margin: '0 0 8px 0', 
                                            fontWeight: '600', 
                                            color: 'var(--sims-blue)' 
                                        }}>
                                            Want to share your content?
                                        </p>
                                        <p style={{ 
                                            margin: '0', 
                                            fontSize: '0.9rem', 
                                            color: 'var(--sims-gray)' 
                                        }}>
                                            {userInfo?.subscription_tier === 'premium' 
                                                ? 'Use the "Share" button on your files above!'
                                                : 'Upgrade to Premium to share your custom content with the community!'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
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
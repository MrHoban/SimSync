import React from 'react'
const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div>
                {/* Spinner */}
                <div className="spinner"></div>

                {/* Loading Text */}
                <p style={{ marginTop: '16px', color: '#6b7280', fontWeight: '500' }}>Loading SimSync...</p>
            </div>
        </div>
    )
}

export default LoadingSpinner
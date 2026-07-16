class YouTubeError(Exception):
    """Base exception for YouTube integration."""
    pass

class YouTubeAuthenticationError(YouTubeError):
    """Raised when authentication fails or token is invalid."""
    pass

class YouTubeUploadError(YouTubeError):
    """Raised when the video upload fails."""
    pass

class YouTubeFileError(YouTubeError):
    """Raised when there is an issue with the local video file."""
    pass

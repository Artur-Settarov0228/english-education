import json
import subprocess
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FFmpegService:
    """
    Service class to handle all video analysis, conversion, and compression using FFmpeg and FFprobe.
    """

    def analyze(self, video_path: str) -> Dict[str, Any]:
        """
        Runs ffprobe on the input file to extract:
        - codec (video)
        - audio_codec
        - bitrate
        - fps
        - duration
        - resolution (width x height)
        
        Args:
            video_path (str): Path to the video file.
            
        Returns:
            dict: Extracted video properties.
        """
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            video_stream = {}
            audio_stream = {}
            
            for stream in data.get('streams', []):
                if stream.get('codec_type') == 'video':
                    video_stream = stream
                elif stream.get('codec_type') == 'audio':
                    audio_stream = stream
            
            format_info = data.get('format', {})
            
            # Extract FPS
            fps = None
            avg_frame_rate = video_stream.get('avg_frame_rate', '')
            if '/' in avg_frame_rate:
                try:
                    num, den = map(int, avg_frame_rate.split('/'))
                    if den != 0:
                        fps = round(num / den, 2)
                except ValueError:
                    pass
            
            analysis = {
                'codec': video_stream.get('codec_name'),
                'audio_codec': audio_stream.get('codec_name'),
                'bitrate': int(format_info.get('bit_rate')) if format_info.get('bit_rate') else None,
                'fps': fps,
                'duration': float(format_info.get('duration')) if format_info.get('duration') else None,
                'resolution': f"{video_stream.get('width')}x{video_stream.get('height')}" if video_stream.get('width') else None,
            }
            
            logger.info(f"Video analysis completed for {video_path}: {analysis}")
            return analysis
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFprobe failed for {video_path}: {e.stderr}")
            raise RuntimeError(f"FFprobe failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Failed to analyze video {video_path}: {str(e)}")
            raise

    def convert(self, input_path: str, output_path: str) -> str:
        """
        Converts input video to H.264 video codec and AAC audio codec
        using FFmpeg with standard optimized settings (preset medium, CRF 23, faststart).
        
        Args:
            input_path (str): Input file path.
            output_path (str): Output MP4 file path.
            
        Returns:
            str: Output file path.
        """
        cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-movflags', '+faststart',
            output_path
        ]
        
        logger.info(f"Starting FFmpeg video conversion: {input_path} -> {output_path}")
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Video converted successfully to: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr}")
            raise RuntimeError(f"FFmpeg conversion failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Unexpected error during FFmpeg conversion: {str(e)}")
            raise

    def compress(self, input_path: str, output_path: str) -> str:
        """
        Compresses the video using a higher CRF value (e.g., CRF 28) to reduce file size.
        
        Args:
            input_path (str): Input file path.
            output_path (str): Output MP4 file path.
            
        Returns:
            str: Output file path.
        """
        cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '28',
            '-c:a', 'aac',
            '-movflags', '+faststart',
            output_path
        ]
        
        logger.info(f"Starting FFmpeg compression: {input_path} -> {output_path}")
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Video compressed successfully to: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg compression failed: {e.stderr}")
            raise RuntimeError(f"FFmpeg compression failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Unexpected error during FFmpeg compression: {str(e)}")
            raise

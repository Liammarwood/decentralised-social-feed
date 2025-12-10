import { useRef, useState } from 'react'

interface CameraProps {
  onCapture: (imageData: ImageData) => void
  onClose: () => void
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    onCapture(imageData)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div>
              <p className="mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white text-black rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      <div className="p-4 flex justify-center space-x-4">
        {!stream && !error && (
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
          >
            Start Camera
          </button>
        )}

        {stream && (
          <>
            <button
              onClick={captureFrame}
              className="px-6 py-3 bg-white text-black rounded-full text-lg font-semibold w-16 h-16 flex items-center justify-center"
            >
              📸
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-red-600 text-white rounded-lg text-lg font-semibold"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Play, Youtube } from 'lucide-react'

interface YouTubeVideosProps {
  videos: Array<{
    videoId: string
    title: string
    description: string
    thumbnail: string
  }>
}

export default function YouTubeVideos({ videos }: YouTubeVideosProps) {
  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white rounded-3xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Youtube className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-semibold text-gray-800">Travel Videos</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <motion.a
            key={video.videoId}
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="group block"
          >
            <div className="relative rounded-2xl overflow-hidden mb-3">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
            <h4 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {video.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {video.description}
            </p>
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}

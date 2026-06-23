'use client'

import { motion } from 'framer-motion'
import { Code2, Users, Target, Zap } from 'lucide-react'

export default function Branding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 shadow-xl mt-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Built by</h2>
        <p className="text-2xl font-semibold text-blue-600">PM Accelerator Developer</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-purple-600" />
          About PM Accelerator
        </h3>
        <p className="text-gray-700 leading-relaxed mb-6">
          PM Accelerator is a premier program designed to accelerate the careers of aspiring and current Product Managers. 
          Through comprehensive training, mentorship, and hands-on project experience, participants develop the skills needed 
          to excel in product management roles at top tech companies. The program focuses on practical application, 
          industry best practices, and building a strong professional network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-50 rounded-xl p-4 text-center"
          >
            <Code2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Technical Skills</h4>
            <p className="text-sm text-gray-600">Full-stack development expertise</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-blue-50 rounded-xl p-4 text-center"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Leadership</h4>
            <p className="text-sm text-gray-600">Team collaboration & mentorship</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-green-50 rounded-xl p-4 text-center"
          >
            <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold text-gray-800">Innovation</h4>
            <p className="text-sm text-gray-600">Building cutting-edge solutions</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

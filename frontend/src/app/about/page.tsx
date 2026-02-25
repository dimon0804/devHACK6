'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Target,
  Shield,
  TrendingUp,
  Users,
  GraduationCap,
  Heart,
  CheckCircle,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export default function AboutPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const steps = [
    {
      icon: Target,
      title: t('about.step1'),
      text: t('about.step1Text'),
    },
    {
      icon: TrendingUp,
      title: t('about.step2'),
      text: t('about.step2Text'),
    },
    {
      icon: Shield,
      title: t('about.step3'),
      text: t('about.step3Text'),
    },
  ]

  const audiences = [
    {
      icon: Heart,
      title: t('about.forChildren'),
      text: t('about.forChildrenText'),
    },
    {
      icon: Users,
      title: t('about.forParents'),
      text: t('about.forParentsText'),
    },
    {
      icon: GraduationCap,
      title: t('about.forSchools'),
      text: t('about.forSchoolsText'),
    },
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-400 to-secondary bg-clip-text text-transparent"
          >
            {t('about.heroTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto"
          >
            {t('about.heroSubtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
              <Button
                size="lg"
                variant="primary"
                onClick={() => router.push('/auth/register')}
                className="text-lg px-8 py-4"
              >
                {t('about.startLearning')}
              </Button>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Card glow className="mb-12">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                  <Target className="text-orange-600 dark:text-orange-400" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    {t('about.problemTitle')}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {t('about.problemText')}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Card glow>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <CheckCircle className="text-primary" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    {t('about.solutionTitle')}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {t('about.solutionText')}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            {t('about.howItWorks')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.2 }}
              >
                <Card hover className="text-center h-full">
                  <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-4">
                    <step.icon className="text-primary" size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            {t('about.forWhom')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.2 }}
              >
                <Card hover glow className="h-full">
                  <div className="p-4 bg-secondary/20 rounded-2xl w-fit mb-4">
                    <audience.icon className="text-secondary-600 dark:text-secondary-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{audience.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{audience.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card glow className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('about.ctaTitle')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {t('about.ctaText')}
              </p>
              <Button
                size="lg"
                variant="primary"
                onClick={() => router.push('/auth/register')}
              >
                {t('about.startLearning')}
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

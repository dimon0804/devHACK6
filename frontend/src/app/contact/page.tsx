'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@finteen.ru',
      link: 'mailto:support@finteen.ru',
    },
    {
      icon: Phone,
      title: 'Телефон',
      value: '+7 (800) 123-45-67',
      link: 'tel:+78001234567',
    },
    {
      icon: MapPin,
      title: 'Адрес',
      value: 'г. Москва, ул. Примерная, д. 1',
      link: null,
    },
    {
      icon: Clock,
      title: 'Время работы',
      value: 'Пн-Пт: 9:00 - 18:00',
      link: null,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              {t('footer.contact')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Свяжитесь с нами любым удобным способом
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4">
                    <info.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold mb-2">{info.title}</h3>
                  {info.link ? (
                    <a
                      href={info.link}
                      className="text-sm text-primary hover:underline"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {info.value}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card glow>
              <h2 className="text-2xl font-bold mb-6">Отправить сообщение</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Имя
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Тема
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Тема сообщения"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Сообщение
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Ваше сообщение..."
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full">
                  <Send size={18} className="mr-2" />
                  Отправить сообщение
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

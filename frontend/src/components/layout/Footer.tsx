'use client'

import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, HelpCircle, FileText, Shield, FileCheck } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    legal: [
      { label: t('footer.privacyPolicy'), href: '/legal/privacy', icon: Shield },
      { label: t('footer.termsOfService'), href: '/legal/terms', icon: FileText },
      { label: t('footer.offer'), href: '/legal/offer', icon: FileCheck },
    ],
    support: [
      { label: t('footer.about'), href: '/about', icon: HelpCircle },
      { label: t('footer.contact'), href: '/contact', icon: Mail },
      { label: t('footer.support'), href: '/support', icon: HelpCircle },
    ],
  }

  return (
    <footer className="relative mt-auto border-t border-[var(--card-border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent"
            >
              {t('common.fintechEducation')}
            </motion.h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('footer.tagline')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © {currentYear} FinTeen. {t('footer.rights')}
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Юридические документы
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Поддержка
            </h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

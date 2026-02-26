'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: string[]
  explanation?: string
}

interface Quiz {
  id: number
  title: string
  questions: Question[]
}

export default function QuizPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const quizId = parseInt(params.id as string)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/api/v1/quizzes/${quizId}`)
      setQuiz(response.data)
    } catch (err) {
      console.error('Failed to fetch quiz', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (submitted) return
    setSelectedAnswers({
      ...selectedAnswers,
      [quiz!.questions[currentQuestion].id]: answerIndex
    })
  }

  const handleSubmit = async () => {
    if (!quiz) return

    const answers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId),
      answer
    }))

    try {
      const response = await api.post(`/api/v1/quizzes/${quizId}/submit`, {
        quiz_id: quizId,
        answers
      })
      setResult(response.data)
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit quiz', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('quizzes.loadingQuiz')}</div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Quiz not found</div>
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 py-8 pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card glow className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <CheckCircle size={64} className="text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">{t('quizzes.congratulations')}</h2>
                <p className="text-xl mb-6">{t('quizzes.quizCompleted')}</p>
                <div className="space-y-2 mb-6">
                  <p className="text-lg">
                    {t('quizzes.yourScore')}: <span className="font-bold text-primary">{result.score}%</span>
                  </p>
                  <p>
                    {t('quizzes.correctAnswers')}: {result.correct_answers} / {result.total_questions}
                  </p>
                  {result.xp_earned > 0 && (
                    <p className="text-primary font-bold">
                      {t('quizzes.xpEarned')}: {result.xp_earned} XP
                    </p>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Button variant="primary" onClick={() => router.push('/quizzes')}>
                    {t('quizzes.backToQuizzes')}
                  </Button>
                  <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                    {t('common.dashboard')}
                  </Button>
                </div>
              </motion.div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const selectedAnswer = selectedAnswers[question.id]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/quizzes')}
            className="mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t('common.back')}
          </Button>

          <Card glow className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} / {quiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>
          </Card>

          <Card glow className="p-6">
            <h2 className="text-xl font-bold mb-6">{question.question}</h2>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedAnswer === index
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              {currentQuestion > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  {t('common.previous')}
                </Button>
              )}
              <div className="flex-1" />
              {currentQuestion < quiz.questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={selectedAnswer === undefined}
                >
                  {t('quizzes.nextQuestion')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={selectedAnswer === undefined}
                >
                  {t('quizzes.finishQuiz')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

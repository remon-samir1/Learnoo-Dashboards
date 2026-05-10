import { ICourse } from '@/src/interfaces/courses.interface'
import { ILiveSessions } from '@/src/interfaces/livesessions.interface'
import { IProgress } from '@/src/interfaces/progress.interface'
import { IStudent } from '@/src/interfaces/student.interface'
import { useTranslations } from 'next-intl'

const WelcomeSection = ({student, progress, courses, liveSessions}: {student: IStudent, progress: IProgress, courses: ICourse, liveSessions: ILiveSessions}) => {
   const t = useTranslations("student.home.welcome");
  return (
    <div className='p-8 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-2xl text-white'>
      <h2>{t('title')}</h2>
    </div>
  )
}

export default WelcomeSection

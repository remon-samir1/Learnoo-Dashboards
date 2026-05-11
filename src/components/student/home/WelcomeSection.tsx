import { ICourse } from '@/src/interfaces/courses.interface'
import { ILiveSessions } from '@/src/interfaces/livesessions.interface'
import { IProgress } from '@/src/interfaces/progress.interface'
import { IStudent } from '@/src/interfaces/student.interface'
import { BookOpen, FileText, Video } from 'lucide-react'
import { useTranslations } from 'next-intl'



const WelcomeSection = ({coursesCount, progressCount, student, liveSessionsCount}: {student: IStudent, progressCount: number, coursesCount: number, liveSessionsCount: number}) => {
   const t = useTranslations("student.home.welcome");
   const tC = useTranslations("universities");
  
  return (
    <section className='p-8 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-2xl text-white flex flex-col gap-4'>
      <h2 className='text-3xl lg:text-5xl font-bold'>{`${t('title')} ${student.first_name} 👋` } </h2>
      <p >{student?.university?.data?.attributes.name || tC("notFound")}</p>
      <div className=" flex flex-wrap items-center gap-6 text-sm text-white/90">
  <div className="flex items-center gap-2">
    <BookOpen size={16} />
    <span>{coursesCount} Active Courses</span>
  </div>

  <div className="flex items-center gap-2">
    <Video size={16} />
    <span>{liveSessionsCount} Live Today</span>
  </div>

  <div className="flex items-center gap-2">
    <FileText size={16} />
    <span>{progressCount} Upcoming Exams</span>
  </div>
</div>
    </section>
  )
}

export default WelcomeSection

import { ILiveSessions } from '@/src/interfaces/livesessions.interface';
import { useTranslations } from 'next-intl';
import React from 'react'



const ContinueWatchingSection = ({liveSessions}:{liveSessions: ILiveSessions[]}) => {
    const t = useTranslations("student.home.continueWatching");
  return (
    <section className='p-8   flex flex-col gap-4'>
      <span className='text-2xl lg:text-3xl font-bold'>{t("continue")}</span>
    </section>
  )
}

export default ContinueWatchingSection

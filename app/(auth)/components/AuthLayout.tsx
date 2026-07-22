import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthPageLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-auth-bg flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-[448px] flex flex-col items-center gap-0">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 gap-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-blue rounded-2xl flex items-center justify-center shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1),0px_10px_15px_-3px_rgba(0,0,0,0.1)] mb-4 transition-all">
            <Logo className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="font-sans font-bold text-[22px] sm:text-[25.5px] leading-tight sm:leading-9 text-text-dark text-center mb-2 transition-all">{title}</h1>
          <p className="font-sans font-normal text-[12px] sm:text-[13.6px] leading-relaxed sm:leading-6 text-text-muted text-center max-w-[320px] sm:max-w-none transition-all">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="w-full bg-white border border-border-color shadow-[0px_0px_8px_rgba(0,0,0,0.1)] rounded-2xl p-5 sm:p-6 transition-all">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

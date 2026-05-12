import Logo from '@/components/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthPageLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-auth-bg flex items-center justify-center px-6 py-12 font-sans">
      <div className="w-[448px] flex flex-col items-center gap-0">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-0">
          <div className="w-16 h-16 bg-primary-blue rounded-2xl flex items-center justify-center shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1),0px_10px_15px_-3px_rgba(0,0,0,0.1)] mb-4">
            <Logo className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-sans font-bold text-[25.5px] leading-9 text-text-dark text-center mb-2">{title}</h1>
          <p className="font-sans font-normal text-[13.6px] leading-6 text-text-muted text-center">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="w-[448px] bg-white border border-border-color shadow-[0px_0px_8px_rgba(0,0,0,0.1)] rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

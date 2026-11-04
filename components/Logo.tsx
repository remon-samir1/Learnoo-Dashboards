import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function Logo({ className, width = 40, height = 39 }: LogoProps) {
  return <Image
    src="/Logo.jpeg"
    alt="Learnoo"
    width={typeof width === 'number' ? width : 40}
    height={typeof height === 'number' ? height : 39}
    className={className}
    style={{ objectFit: 'contain' }}
  />;
}

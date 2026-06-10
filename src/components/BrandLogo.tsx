import logo from '../assets/logo.png';

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = 'h-12 w-auto object-contain' }: BrandLogoProps) {
  return <img src={logo} alt="MC.Engineering" className={className} draggable={false} />;
}

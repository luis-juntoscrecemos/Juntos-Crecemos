import logoPath from '@/assets/juntos-crecemos-logo.svg';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = '' }: AuthLogoProps) {
  return (
    <div className={`text-center mb-8 ${className}`}>
      <img 
        src={logoPath} 
        alt="Juntos Crecemos" 
        className="h-12 mx-auto mb-4"
        data-testid="img-logo"
      />
      <h1 className="text-2xl font-bold">Juntos Crecemos</h1>
      <p className="text-muted-foreground mt-1">Plataforma de Donaciones para ONGs</p>
    </div>
  );
}

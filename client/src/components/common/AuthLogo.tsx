import logoPath from '@/assets/juntos-crecemos-logo.png';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = '' }: AuthLogoProps) {
  return (
    <div className={`text-center mb-8 ${className}`}>
      <img 
        src={logoPath} 
        alt="Juntos Crecemos" 
        className="h-24 mx-auto mb-2"
        data-testid="img-logo"
      />
      <p className="text-muted-foreground">Plataforma de Donaciones para ONGs</p>
    </div>
  );
}

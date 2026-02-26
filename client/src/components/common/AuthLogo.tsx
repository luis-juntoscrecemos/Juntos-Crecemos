import darkLogoPath from '@assets/Juntos_Crecemos_Transparent_1772133029306.png';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = '' }: AuthLogoProps) {
  return (
    <div className={`text-center mb-8 ${className}`}>
      <img 
        src={darkLogoPath} 
        alt="Juntos Crecemos" 
        className="h-32 mx-auto mb-2"
        data-testid="img-logo"
      />
      <p className="text-muted-foreground">Plataforma de Donaciones para ONGs</p>
    </div>
  );
}

interface CardProps {
  title?: string;
  children: React.ReactNode;
  borderColor?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  borderColor = 'border-black', 
  className = '' 
}) => {
  return (
    <div className={`bg-white border-2 ${borderColor} p-0 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      {title && (
        <div className={`border-b-2 ${borderColor} p-4 bg-gray-50`}>
          <h3 className="text-lg font-display font-bold uppercase tracking-tight text-black">{title}</h3>
        </div>
      )}
      <div className="p-6 flex-grow">
        {children}
      </div>
    </div>
  );
};

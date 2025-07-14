type Props = {
  value: number;
  className?: string; // add this line
};

export const Progress = ({ value, className = '' }: Props) => {
  return (
    <div className={`w-full bg-gray-200 h-2 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-orange-500 h-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};
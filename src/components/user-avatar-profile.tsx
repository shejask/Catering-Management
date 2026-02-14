import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
}

export function UserAvatarProfile({
  className,
  showInfo = false
}: UserAvatarProfileProps) {
  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src="" alt="User" />
        <AvatarFallback className='rounded-lg'>
          U
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>User</span>
          <span className='truncate text-xs'>
            user@example.com
          </span>
        </div>
      )}
    </div>
  );
}

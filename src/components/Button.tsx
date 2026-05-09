import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  icon,
}) => {
  const variants = {
    primary: 'bg-[#B3261E] text-white',
    secondary: 'bg-gray-200 text-gray-800',
    outline: 'border border-[#B3261E] bg-transparent text-[#B3261E]',
    ghost: 'bg-transparent text-[#B3261E]',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-gray-800',
    outline: 'text-[#B3261E]',
    ghost: 'text-[#B3261E]',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center rounded-xl px-6 py-4 active:opacity-80',
        variants[variant],
        (disabled || loading) && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#B3261E'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={cn('text-lg font-bold', textVariants[variant])}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

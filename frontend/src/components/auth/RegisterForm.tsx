import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, selectAuthLoading } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { connectWebSocket } from '@/services/websocket';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain lowercase, uppercase, and number'
    ),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength - 1, 4)] || '',
      color: colors[Math.min(strength - 1, 4)] || 'bg-gray-300',
    };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, agreeTerms, ...registerData } = data;
      const result = await dispatch(registerUser(registerData));
      
      if (registerUser.fulfilled.match(result)) {
        // Store tokens in localStorage for persistence
        localStorage.setItem('okaygoal-token', result.payload.access_token);
        localStorage.setItem('okaygoal-refresh-token', result.payload.refresh_token);
        localStorage.setItem('okaygoal-user', JSON.stringify(result.payload.user));
        
        // Connect WebSocket with new token
        connectWebSocket(result.payload.access_token);
        
        toast.success('Welcome to OkayGoal!');
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.payload as string || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">⚽</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Join OkayGoal
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create your account to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('first_name')}
            label="First name"
            placeholder="Enter first name"
            leftIcon={<User className="w-5 h-5" />}
            error={errors.first_name?.message}
            disabled={isLoading}
          />

          <Input
            {...register('last_name')}
            label="Last name"
            placeholder="Enter last name"
            leftIcon={<User className="w-5 h-5" />}
            error={errors.last_name?.message}
            disabled={isLoading}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label="Email address"
          placeholder="Enter your email"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div>
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            error={errors.password?.message}
            disabled={isLoading}
          />
          
          {password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-16">
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <Input
          {...register('confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />

        <div>
          <label className="flex items-start">
            <input
              {...register('agreeTerms')}
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.agreeTerms.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          Create account
        </Button>

        <div className="text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
          </span>
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};
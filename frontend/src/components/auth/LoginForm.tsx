import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, selectAuthLoading } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { connectWebSocket } from '@/services/websocket';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await dispatch(loginUser(data));
      
      if (loginUser.fulfilled.match(result)) {
        // Store tokens in localStorage for persistence
        localStorage.setItem('okaygoal-token', result.payload.access_token);
        localStorage.setItem('okaygoal-refresh-token', result.payload.refresh_token);
        localStorage.setItem('okaygoal-user', JSON.stringify(result.payload.user));
        
        // Connect WebSocket with new token
        connectWebSocket(result.payload.access_token);
        
        toast.success('Welcome back!');
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.payload as string || 'Login failed');
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
          Welcome back
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your OkayGoal account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          {...register('email')}
          type="email"
          label="Email address"
          placeholder="Enter your email"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          disabled={isLoading}
        />

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

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>
          
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          Sign in
        </Button>

        <div className="text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
          </span>
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
          >
            Sign up
          </Link>
        </div>
      </form>

      {/* Demo credentials */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Demo Account
        </h4>
        <div className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
          <div>Email: demo@okaygoal.com</div>
          <div>Password: demo123456</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            handleSubmit(onSubmit)({
              email: 'demo@okaygoal.com',
              password: 'demo123456'
            });
          }}
        >
          Use Demo Account
        </Button>
      </div>
    </div>
  );
};
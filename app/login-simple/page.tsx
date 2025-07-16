'use client';

import { signIn } from 'next-auth/react';

export default function LoginSimplePage() {
  const testLogin = () => {
    console.log('Button clicked - attempting login');
    
    signIn('credentials', {
      email: 'admin@fabletech.com',
      password: 'admin123',
      redirect: false,
    }).then(result => {
      console.log('Login result:', result);
      if (result?.ok) {
        window.location.href = '/manage';
      }
    }).catch(err => {
      console.error('Login error:', err);
    });
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Simple Login Test</h1>
        
        <button
          onClick={testLogin}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded"
        >
          Login with Hardcoded Credentials
        </button>
        
        <p className="mt-4 text-sm text-gray-400">
          Check console for logs
        </p>
      </div>
    </div>
  );
}
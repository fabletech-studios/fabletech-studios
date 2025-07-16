'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();
  
  const addLog = (msg: string) => {
    const logMsg = `${new Date().toISOString()}: ${msg}`;
    console.log(logMsg);
    setLogs(prev => [...prev, logMsg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    addLog('=== Form submission started ===');
    
    try {
      addLog('1. Preventing default');
      e.preventDefault();
      addLog('2. Default prevented successfully');
      
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      addLog(`3. Form data extracted: email=${email}, password=***`);
      
      addLog('4. Checking if signIn is available...');
      // Try dynamic import to catch any import errors
      try {
        const { signIn } = await import('next-auth/react');
        addLog('5. signIn imported successfully');
        
        addLog('6. Calling signIn...');
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        addLog(`7. signIn result: ${JSON.stringify(result)}`);
        
        if (result?.ok) {
          addLog('8. Login successful, redirecting...');
          router.push('/manage');
        } else {
          addLog(`8. Login failed: ${result?.error}`);
        }
      } catch (importError) {
        addLog(`ERROR importing next-auth: ${importError}`);
      }
    } catch (error) {
      addLog(`CRITICAL ERROR: ${error}`);
      addLog(`Error stack: ${error.stack}`);
    }
    
    addLog('=== Form submission ended ===');
  };
  
  // Test basic functionality
  const testBasic = () => {
    addLog('Basic button click works');
    alert('JavaScript is working');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Login Debug Page</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl mb-4">Login Form</h2>
          
          <button 
            onClick={testBasic}
            className="mb-4 px-4 py-2 bg-green-600 rounded"
          >
            Test Basic JS
          </button>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Email</label>
              <input
                name="email"
                type="email"
                defaultValue="admin@fabletech.com"
                className="w-full p-2 bg-gray-800 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1">Password</label>
              <input
                name="password"
                type="password"
                defaultValue="admin123"
                className="w-full p-2 bg-gray-800 rounded"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Test Login
            </button>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl mb-4">Debug Logs</h2>
          <div className="bg-gray-900 p-4 rounded h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

export default function FormTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, msg]);
  };
  
  // Test 1: Inline onSubmit
  const handleSubmit1 = (e: React.FormEvent) => {
    addLog('Test 1: Inline onSubmit called');
    e.preventDefault();
    addLog('Test 1: preventDefault executed');
  };
  
  // Test 2: Form with async handler
  const handleSubmit2 = async (e: React.FormEvent) => {
    addLog('Test 2: Async handler called');
    e.preventDefault();
    addLog('Test 2: preventDefault executed');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('Test 2: Async operation completed');
  };
  
  // Test 3: Direct form element
  const handleSubmit3 = (e: any) => {
    addLog('Test 3: Direct form submit');
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    addLog(`Test 3: Form data - ${formData.get('test')}`);
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Form Submission Tests</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Test 1 */}
          <div className="bg-gray-900 p-4 rounded">
            <h2 className="font-bold mb-2">Test 1: Basic Form</h2>
            <form onSubmit={handleSubmit1}>
              <input
                type="text"
                placeholder="Type anything"
                className="w-full p-2 bg-gray-800 rounded mb-2"
              />
              <button
                type="submit"
                className="w-full p-2 bg-blue-600 rounded"
              >
                Submit Basic Form
              </button>
            </form>
          </div>
          
          {/* Test 2 */}
          <div className="bg-gray-900 p-4 rounded">
            <h2 className="font-bold mb-2">Test 2: Async Handler</h2>
            <form onSubmit={handleSubmit2}>
              <input
                type="text"
                placeholder="Type anything"
                className="w-full p-2 bg-gray-800 rounded mb-2"
              />
              <button
                type="submit"
                className="w-full p-2 bg-green-600 rounded"
              >
                Submit Async Form
              </button>
            </form>
          </div>
          
          {/* Test 3 */}
          <div className="bg-gray-900 p-4 rounded">
            <h2 className="font-bold mb-2">Test 3: FormData</h2>
            <form onSubmit={handleSubmit3}>
              <input
                name="test"
                type="text"
                placeholder="Type anything"
                className="w-full p-2 bg-gray-800 rounded mb-2"
              />
              <button
                type="submit"
                className="w-full p-2 bg-purple-600 rounded"
              >
                Submit FormData
              </button>
            </form>
          </div>
        </div>
        
        <div>
          <h2 className="font-bold mb-2">Logs:</h2>
          <div className="bg-gray-900 p-4 rounded h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
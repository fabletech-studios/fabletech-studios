'use client';

export default function AuthTest() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');
    
    console.log('Form submitted:', { email, password });
    
    try {
      // Direct API call to NextAuth
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email as string,
          password: password as string,
          csrfToken: '', // NextAuth will handle this
        }),
      });
      
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);
      
      if (response.ok) {
        window.location.href = '/manage';
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error: ' + error.message);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Auth Test</h1>
        
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
            className="w-full p-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
          >
            Test Login
          </button>
        </form>
        
        <div className="mt-4 text-sm text-gray-400">
          <p>Check browser console for logs</p>
        </div>
      </div>
    </div>
  );
}
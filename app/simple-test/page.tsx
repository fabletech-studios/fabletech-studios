export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Simple Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => alert('Inline onclick works!')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Test Inline onClick
        </button>
        
        <button
          onClick={() => console.log('Console log works!')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          Test Console Log
        </button>
        
        <button
          onClick={() => {
            try {
              const test = new Function('return "Function constructor works"');
              alert(test());
            } catch (e) {
              alert('CSP Error: ' + e.message);
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Test CSP Eval
        </button>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          console.log('Inline script executed');
          window.addEventListener('load', () => {
            console.log('Window loaded');
          });
        `
      }} />
    </div>
  );
}
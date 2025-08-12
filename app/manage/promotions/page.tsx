'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function PromotionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [campaignType, setCampaignType] = useState('welcome');
  const [message, setMessage] = useState('');
  
  // Promotional email form
  const [promoTitle, setPromoTitle] = useState('Special Offer - Limited Time!');
  const [promoDescription, setPromoDescription] = useState('Get exclusive access to our premium content with this special offer.');
  const [discountPercent, setDiscountPercent] = useState(25);
  const [promoCode, setPromoCode] = useState('SPECIAL25');
  const [expiryDays, setExpiryDays] = useState(7);
  
  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/email/test-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          testType: campaignType
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ Failed: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const sendPromotionalCampaign = async () => {
    if (!promoTitle || !promoDescription) {
      setMessage('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/email/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: promoTitle,
          description: promoDescription,
          discountPercent,
          promoCode,
          expiryDays
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Campaign sent to ${result.count} subscribers`);
      } else {
        setMessage(`❌ Failed: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Email Marketing & Promotions</h1>
        
        {/* Test Email Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Test Email Templates</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Test Email Address</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email Template</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
              >
                <option value="welcome">Welcome Email</option>
                <option value="episode">New Episode Notification</option>
                <option value="promotional">Promotional Offer</option>
                <option value="newsletter">Weekly Newsletter</option>
                <option value="all">Send All Templates</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={sendTestEmail}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        
        {/* Promotional Campaign Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Create Promotional Campaign</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Offer Title</label>
              <input
                type="text"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
              <textarea
                value={promoDescription}
                onChange={(e) => setPromoDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Discount %</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                  min="5"
                  max="90"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Expires in (days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  min="1"
                  max="30"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white bg-gray-700 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={sendPromotionalCampaign}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending Campaign...' : 'Send to All Subscribers'}
          </button>
        </div>
        
        {/* Email Templates */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Email Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-semibold mb-2 text-white">✉️ Welcome Email</h3>
              <p className="text-sm text-gray-400 mb-2">Automatically sent when:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• New user signs up with email</li>
                <li>• New user signs up with Google</li>
                <li>• Includes 100 free credits offer</li>
              </ul>
            </div>
            
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-semibold mb-2 text-white">🎧 Episode Notifications</h3>
              <p className="text-sm text-gray-400 mb-2">Notify subscribers about:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• New episode releases</li>
                <li>• Series they follow</li>
                <li>• Direct link to content</li>
              </ul>
            </div>
            
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-semibold mb-2 text-white">🎉 Promotional Campaigns</h3>
              <p className="text-sm text-gray-400 mb-2">Send special offers:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Discount codes</li>
                <li>• Limited time offers</li>
                <li>• Holiday specials</li>
              </ul>
            </div>
            
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-semibold mb-2 text-white">📚 Weekly Newsletter</h3>
              <p className="text-sm text-gray-400 mb-2">Keep users engaged:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Featured content</li>
                <li>• Personalized recommendations</li>
                <li>• Credit balance reminders</li>
              </ul>
            </div>
          </div>
        </div>
        
        {message && (
          <div className={`mt-4 p-4 rounded-lg border ${
            message.startsWith('✅') ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-red-900/20 text-red-400 border-red-600'
          }`}>
            {message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
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
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/email/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promotional',
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
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Email Marketing & Promotions</h1>
        
        {/* Test Email Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Email Templates</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Test Email Address</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email Template</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        
        {/* Promotional Campaign Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create Promotional Campaign</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Offer Title</label>
              <input
                type="text"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
              <textarea
                value={promoDescription}
                onChange={(e) => setPromoDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Discount %</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                  min="5"
                  max="90"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Expires in (days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  min="1"
                  max="30"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                />
              </div>
            </div>
            
            <button
              onClick={sendPromotionalCampaign}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Sending Campaign...' : 'Send to All Subscribers'}
            </button>
          </div>
        </div>
        
        {/* Email Templates */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Email Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-800">✉️ Welcome Email</h3>
              <p className="text-sm text-gray-600 mb-2">Automatically sent when:</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• New user signs up with email</li>
                <li>• New user signs up with Google</li>
                <li>• Includes 100 free credits offer</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-800">🎧 Episode Notifications</h3>
              <p className="text-sm text-gray-600 mb-2">Notify subscribers about:</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• New episode releases</li>
                <li>• Series they follow</li>
                <li>• Direct link to content</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-800">🎉 Promotional Campaigns</h3>
              <p className="text-sm text-gray-600 mb-2">Send special offers:</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Discount codes</li>
                <li>• Limited time offers</li>
                <li>• Holiday specials</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-800">📚 Weekly Newsletter</h3>
              <p className="text-sm text-gray-600 mb-2">Keep users engaged:</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Featured content</li>
                <li>• Personalized recommendations</li>
                <li>• Credit balance reminders</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
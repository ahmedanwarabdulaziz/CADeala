'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/mobile/MobileLayout';
import { 
  Share2, 
  Copy, 
  Users, 
  Check,
  Clock,
  Award,
  Gift,
  ArrowLeft
} from 'lucide-react';
import { 
  createOrGetReferralCode, 
  generateReferralLink, 
  getReferralStats, 
  getReferralHistory,
  type ReferralCode,
  type ReferralStats,
  type Referral
} from '@/lib/referralUtils';
import LoadingDots from '@/components/LoadingDots';

export default function ReferralsMobile() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralHistory, setReferralHistory] = useState<Referral[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user || !userRole) {
      router.push('/signin');
      return;
    }

    loadReferralData();
  }, [user, userRole, loading, router]);

  const loadReferralData = async () => {
    if (!user || !userRole) return;

    try {
      setLoadingData(true);
      
      // For customers, we need to get their business association
      let businessId = '';
      let businessName = '';
      
      if (userRole.role === 'Customer') {
        // Check if customer has business association
        if (userRole.businessAssociation) {
          businessId = userRole.businessAssociation.businessId;
          businessName = userRole.businessAssociation.businessReferenceCode;
        } else {
          console.warn('Customer has no business association for referrals');
          setLoadingData(false);
          return;
        }
      } else if (userRole.role === 'Business') {
        // For business users, use their own business info
        businessId = userRole.businessId || '';
        businessName = userRole.businessName || '';
      }
      
      // Load referral code
      const code = await createOrGetReferralCode(
        user.uid,
        user.email || '',
        user.displayName || 'User',
        businessId,
        businessName
      );
      setReferralCode(code);

      // Load referral stats
      const stats = await getReferralStats(user.uid);
      setReferralStats(stats);

      // Load referral history
      const history = await getReferralHistory(user.uid);
      setReferralHistory(history);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCopyLink = async () => {
    if (!referralCode) return;

    try {
      const referralLink = generateReferralLink(referralCode.referralCode);
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    try {
      const referralLink = generateReferralLink(referralCode.referralCode);
      const shareText = `Join CADeala using my referral link and get exclusive benefits! 🎁\n\n${referralLink}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Join CADeala',
          text: shareText,
          url: referralLink
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(shareText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || loadingData) {
    return (
      <MobileLayout userType="customer">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <LoadingDots size="lg" color="text-orange" className="mb-4" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="customer">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Referrals</h1>
            <p className="text-sm text-gray-600">Track your successful referrals</p>
          </div>
        </div>

        {/* Quick Actions */}
        {referralCode && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Share Your Referral Link</h2>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-navy-blue text-white rounded-lg hover:bg-navy-blue-600 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span className="text-sm font-medium">Copy Link</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
            
            {/* Success Messages */}
            {copySuccess && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Link copied to clipboard!</span>
              </div>
            )}
            {shareSuccess && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Shared successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        {referralStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500/10 rounded-full p-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{referralStats.totalReferrals}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-500/10 rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{referralStats.successfulReferrals}</p>
                    <p className="text-xs text-gray-600">Successful</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-yellow-500/10 rounded-full p-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-yellow-600">{referralStats.pendingReferrals}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-500/10 rounded-full p-1">
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-600">{referralStats.totalPoints}</p>
                    <p className="text-xs text-gray-600">Points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referral History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h2>
          {referralHistory.length > 0 ? (
            <div className="space-y-3">
              {referralHistory.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-full p-2 ${
                      referral.status === 'completed' 
                        ? 'bg-green-100' 
                        : referral.status === 'pending'
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}>
                      {referral.status === 'completed' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : referral.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Users className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{referral.referredUserEmail}</p>
                                           <p className="text-xs text-gray-600">
                       {formatDate(referral.createdAt)}
                       {referral.status === 'completed' && (
                         <span className="ml-1 text-green-600 font-medium">✓ Joined</span>
                       )}
                     </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : referral.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {referral.status === 'completed' ? 'Completed' : 
                       referral.status === 'pending' ? 'Pending' : 'Failed'}
                    </span>
                    {referral.status === 'completed' && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Gift className="h-3 w-3" />
                        <span className="text-xs font-medium">Reward</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-gray-600 text-sm">Start sharing your referral link to see your successful referrals here!</p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-orange/10 rounded-full p-2 mt-1">
                <span className="text-orange font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Share Your Link</p>
                <p className="text-xs text-gray-600">Send your unique referral link to friends via WhatsApp, email, or any app</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-orange/10 rounded-full p-2 mt-1">
                <span className="text-orange font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Friends Join</p>
                <p className="text-xs text-gray-600">When they sign up using your link, they automatically get the "Referral" rank</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-orange/10 rounded-full p-2 mt-1">
                <span className="text-orange font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Earn Rewards</p>
                <p className="text-xs text-gray-600">You earn points and benefits for each successful referral</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
